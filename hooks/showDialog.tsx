import Modal from "components/Modal";
import { createContext, useContext, useState } from "react";

type DialogComponent<T> = (props: { closeDialog: (value: T) => void }) => JSX.Element;

const DialogContext = createContext<(component: DialogComponent<unknown>) => Promise<unknown>>(async () => {});

export default function useShowDialog<T>() {
  return useContext(DialogContext) as ((component: DialogComponent<T>) => Promise<T>);
}

export function DialogProvider({ children }: { children: JSX.Element }) {
  const [_currentComponent, setCurrentComponent] = useState<DialogComponent<unknown>>();
  const [resolveCurrent, setResolveCurrent] = useState<(value: unknown) => void>();

  function showDialog<T>(component: DialogComponent<T>) {
    if (resolveCurrent) {
      resolveCurrent(undefined);
    }

    setCurrentComponent(() => component);

    return new Promise(function(resolve, _reject) {
      setResolveCurrent(() => resolve);
    });
  }
  
  function closeDialog(value: unknown) {
    resolveCurrent && resolveCurrent(value);
    setResolveCurrent(undefined);
    setCurrentComponent(undefined);
  }

  return (
    <>
      <DialogContext.Provider value={showDialog}>
        {children}
      </DialogContext.Provider>
      <Modal isOpen={!!_currentComponent}>
        {_currentComponent
          ? <_currentComponent closeDialog={closeDialog} />
          : null}
      </Modal>
    </>
  );
}
