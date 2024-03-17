This zip file contains the data for a tour made with TourForge. In order for a
mobile tour guide app to use the data, it has to be uploaded to a web server.

Simply upload all the files in this zip to a server, such that they are all
available for download. This includes the index.html and index.js files, which
are there so that users of TourForge can visit the URL where the tour data is
stored and have the tour data be automatically downloaded by TourForge.

For example, the list of files in this archive look something like this:
- tourforge.json
- index.html
- index.js
- dbd57c2b1d5aa3d84bdc7eaa7cd57dd7c66bd6cccd851394b2c4cf96570239ff
- ... more long strings of random numbers and letters ...

The files with long strings of random numbers and letters are assets for the
tour: mostly images and audio. The random numbers and letters of each file
name correspond to the SHA-256 hash of the file.

The web server needs to serve the data in this zip from some common base URL.
Continuing with the previous example, your configuration could serve the files
in a pattern like this:
- https://your.site.example.org/some/path/to/the/files/tourforge.json
- https://your.site.example.org/some/path/to/the/files/index.html
- https://your.site.example.org/some/path/to/the/files/index.js
- https://your.site.example.org/some/path/to/the/files/dbd57c2b1d5aa3d84bdc7eaa7cd57dd7c66bd6cccd851394b2c4cf96570239ff
- ... make sure each asset is included ...

It is important that the files are all served from the same base URL. This URL
is what is used by the tour guide mobile app to know where to download the tour
files.