use std::{
    ffi::{c_char, CStr, CString, OsStr},
    fmt,
    sync::RwLock,
};

lazy_static::lazy_static! {
    static ref LOTYR_LIBRARY: RwLock<Option<&'static LotyrLibrary>> = RwLock::new(None);
}

/// Loads the library if it hasn't already been loaded.
pub fn load_library(library_path: &OsStr) -> Result<(), Box<dyn std::error::Error>> {
    if LOTYR_LIBRARY.read().unwrap().is_none() {
        let mut lock = LOTYR_LIBRARY.write().unwrap();
        if lock.is_none() {
            *lock = Some(LotyrLibrary::load(library_path)?);
        }
    }

    Ok(())
}

/// Gets a reference to the library, panicing if it is not yet loaded.
fn get_library() -> &'static LotyrLibrary {
    LOTYR_LIBRARY
        .read()
        .unwrap()
        .expect("Tried to access the Lotyr library, but it is not loaded yet")
}

struct LotyrLibrary {
    dylib: &'static libloading::Library,
    lotyr_new: libloading::Symbol<'static, LotyrNewFn>,
    lotyr_free: libloading::Symbol<'static, LotyrFreeFn>,
    lotyr_route: libloading::Symbol<'static, LotyrRouteFn>,
    lotyr_error_message: libloading::Symbol<'static, LotyrErrorMessageFn>,
    lotyr_error_free: libloading::Symbol<'static, LotyrErrorFreeFn>,
}

type Opaque = [u8; 0];
type LotyrNewFn = unsafe extern "C" fn(*mut *mut Opaque, *const c_char) -> *mut Opaque;
type LotyrFreeFn = unsafe extern "C" fn(*mut Opaque) -> *mut Opaque;
type LotyrRouteFn =
    unsafe extern "C" fn(*mut Opaque, *const c_char, *mut *mut c_char) -> *mut Opaque;
type LotyrErrorMessageFn = unsafe extern "C" fn(*const Opaque) -> *const c_char;
type LotyrErrorFreeFn = unsafe extern "C" fn(*mut Opaque);

impl LotyrLibrary {
    fn load(library_path: &OsStr) -> Result<&'static LotyrLibrary, Box<dyn std::error::Error>> {
        let dylib = Box::leak(Box::new(unsafe { libloading::Library::new(library_path) }?));

        let library = Box::leak(Box::new(unsafe {
            LotyrLibrary {
                lotyr_new: dylib.get(b"lotyr_new").unwrap(),
                lotyr_free: dylib.get(b"lotyr_free").unwrap(),
                lotyr_route: dylib.get(b"lotyr_route").unwrap(),
                lotyr_error_message: dylib.get(b"lotyr_error_message").unwrap(),
                lotyr_error_free: dylib.get(b"lotyr_error_free").unwrap(),
                dylib,
            }
        }));

        Ok(library)
    }
}

pub struct Lotyr {
    ptr: *mut Opaque,
}

// lotyr instances are indeed Send, but not guaranteed to be Sync
unsafe impl Send for Lotyr {}

impl Lotyr {
    pub fn new(config_path: &OsStr) -> Result<Lotyr, LotyrError> {
        let library = get_library();

        let config_path = CString::new(config_path.to_str().unwrap()).unwrap();
        let mut ptr: *mut Opaque = std::ptr::null_mut();

        unsafe {
            Self::lotyr_error((library.lotyr_new)(&mut ptr, config_path.as_ptr()))?;
        }

        Ok(Lotyr { ptr })
    }

    pub fn route(&self, request: &str) -> Result<String, LotyrError> {
        let library = get_library();

        let request = CString::new(request).unwrap();
        let mut response: *mut c_char = std::ptr::null_mut();

        unsafe {
            Self::lotyr_error((library.lotyr_route)(
                self.ptr,
                request.as_ptr(),
                &mut response,
            ))?;
        }

        let response = unsafe { CStr::from_ptr(response) };

        Ok(response.to_str().unwrap().to_owned())
    }

    fn lotyr_error(err: *mut Opaque) -> Result<(), LotyrError> {
        match LotyrError::new(err) {
            Some(err) => Err(err),
            None => Ok(()),
        }
    }
}

impl Drop for Lotyr {
    fn drop(&mut self) {
        unsafe {
            (get_library().lotyr_free)(self.ptr);
        }
    }
}

pub struct LotyrError {
    ptr: *mut Opaque,
}

// LotyrErrors are Send just like Lotyr instances.
// They aren't sync, but it is allowable for multiple different LotyrError instances
// to be dropped at the same time. If this wasn't allowable then Lotyr couldn't be
// Send, since errors from the same Lotyr instance could be sent out to multiple
// threads and then dropped at the same time.
unsafe impl Send for LotyrError {}

impl LotyrError {
    pub fn new(ptr: *mut Opaque) -> Option<LotyrError> {
        if !ptr.is_null() {
            Some(LotyrError { ptr })
        } else {
            None
        }
    }

    fn message(&self) -> &str {
        let message = unsafe { (get_library().lotyr_error_message)(self.ptr) };
        let message = unsafe { CStr::from_ptr(message) };
        message.to_str().unwrap()
    }
}

impl fmt::Debug for LotyrError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = self.message();

        write!(f, "LotyrError({message:?})")
    }
}

impl fmt::Display for LotyrError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "lotyr error: {}", self.message())
    }
}

impl std::error::Error for LotyrError {}

impl Drop for LotyrError {
    fn drop(&mut self) {
        unsafe { (get_library().lotyr_error_free)(self.ptr) }
    }
}
