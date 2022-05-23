import React, { useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';

export const FilePicker = ({
  width,
  height,
  component,
  currentState,
  onComponentOptionChanged,
  onEvent,
  darkMode,
  styles,
}) => {
  //* properties definitions
  const enableDropzone = component.definition.properties.enableDropzone.value ?? true;
  const enablePicker = component.definition.properties?.enablePicker?.value ?? true;
  const maxFileCount = component.definition.properties.maxFileCount?.value ?? 2;
  const enableMultiple = component.definition.properties.enableMultiple?.value ?? false;
  const fileType = component.definition.properties.fileType?.value ?? 'image/*';
  const maxSize = component.definition.properties.maxSize?.value ?? 1048576;
  const minSize = component.definition.properties.minSize?.value ?? 0;
  const parseContent = component.definition.properties.parseContent?.value ?? false;
  const fileTypeFromExtension = component.definition.properties.parseFileType?.value ?? 'auto-detect';

  const parsedEnableDropzone =
    typeof enableDropzone !== 'boolean' ? resolveWidgetFieldValue(enableDropzone, currentState) : true;
  const parsedEnablePicker =
    typeof enablePicker !== 'boolean' ? resolveWidgetFieldValue(enablePicker, currentState) : true;

  const parsedMaxFileCount =
    typeof maxFileCount !== 'number' ? resolveWidgetFieldValue(maxFileCount, currentState) : maxFileCount;
  const parsedEnableMultiple =
    typeof enableMultiple !== 'boolean' ? resolveWidgetFieldValue(enableMultiple, currentState) : enableMultiple;
  const parsedFileType = resolveWidgetFieldValue(fileType, currentState);
  const parsedMinSize = typeof fileType !== 'number' ? resolveWidgetFieldValue(minSize, currentState) : minSize;
  const parsedMaxSize = typeof fileType !== 'number' ? resolveWidgetFieldValue(maxSize, currentState) : maxSize;
  //* styles definitions
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;
  const parsedWidgetVisibility =
    typeof widgetVisibility !== 'boolean' ? resolveWidgetFieldValue(widgetVisibility, currentState) : widgetVisibility;

  const bgThemeColor = darkMode ? '#232E3C' : '#fff';

  const baseStyle = {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    borderWidth: 1.5,
    borderRadius: `${styles.borderRadius}px`,
    borderColor: '#42536A',
    borderStyle: 'dashed',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
    display: parsedWidgetVisibility ? 'flex' : 'none',
    height,
    backgroundColor: !parsedDisabledState && bgThemeColor,
  };

  const activeStyle = {
    borderColor: '#2196f3',
  };

  const acceptStyle = {
    borderColor: '#00e676',
  };

  const rejectStyle = {
    borderColor: '#ff1744',
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, acceptedFiles, fileRejections } =
    useDropzone({
      accept: parsedFileType,
      noClick: !parsedEnablePicker,
      noDrag: !parsedEnableDropzone,
      noKeyboard: true,
      maxFiles: parsedMaxFileCount,
      minSize: parsedMinSize,
      maxSize: parsedMaxSize,
      multiple: parsedEnableMultiple,
      disabled: parsedDisabledState,
      onFileDialogCancel: () => (selectedFiles.length > 0 ? setShowSelectedFiles(true) : setShowSelectedFiles(false)),
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive && parsedEnableDropzone ? activeStyle : {}),
      ...(isDragAccept && parsedEnableDropzone ? acceptStyle : {}),
      ...(isDragReject && parsedEnableDropzone ? rejectStyle : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseStyle, isDragActive, isDragAccept, acceptStyle, isDragReject]
  );

  const [accepted, setAccepted] = React.useState(false);
  const [showSelectedFiles, setShowSelectedFiles] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState([]);

  /**
   * *getFileData()
   * @param {*} file
   * @param {*} method: readAsDataURL, readAsText
   */
  const getFileData = (file = {}, method = 'readAsText') => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (result) => {
        resolve([result, reader]);
      };
      reader[method](file);
      reader.onerror = (error) => {
        reject(error);
        if (error.name == 'NotReadableError') {
          toast.error(error.message);
        }
      };
    }).then((result) => {
      if (method === 'readAsDataURL') {
        return result[0].srcElement.result.split(',')[1];
      }
      return result[0].srcElement.result;
    });
  };

  const fileReader = async (file) => {
    // * readAsText
    const readFileAsText = await getFileData(file);

    // * readAsDataURL
    const readFileAsDataURL = await getFileData(file, 'readAsDataURL');
    const autoDetectFileType = fileTypeFromExtension === 'auto-detect';

    // * parse file content
    const shouldProcessFileParsing = parseContent
      ? await parseFileContent(file, autoDetectFileType, fileTypeFromExtension)
      : false;

    return {
      name: file.name,
      type: file.type,
      content: readFileAsText,
      dataURL: readFileAsDataURL, // TODO: Fix dataURL to have correct format
      base64Data: readFileAsDataURL,
      parsedData: shouldProcessFileParsing ? await processFileContent(file.type, readFileAsText) : null,
    };
  };

  const handleFileRejection = (fileRejections) => {
    const uniqueFileRejecetd = fileRejections.reduce((acc, rejectedFile) => {
      if (!acc.includes(rejectedFile.errors[0].message)) {
        acc.push(handleFileSizeErorrs(rejectedFile.file.size, rejectedFile.errors[0]));
      }
      return acc;
    }, []);
    setShowSelectedFiles(true);
    uniqueFileRejecetd.map((rejectedMessag) => toast.error(rejectedMessag));
  };

  //** checks error codes for max and min size  */
  const handleFileSizeErorrs = (rejectedFileSize, errorObj) => {
    const { message, code } = errorObj;

    const errorType = Object.freeze({
      MIN_SIZE: 'file-too-small',
      MAX_SIZE: 'file-too-large',
    });

    const fileSize = formatFileSize(rejectedFileSize);

    if (code === errorType.MIN_SIZE) {
      return `File size is too small. Minimum size is ${fileSize}`;
    }
    if (code === errorType.MAX_SIZE) {
      return `File size is too large. Maximum size is ${fileSize}`;
    }

    return message;
  };

  useEffect(() => {
    if (acceptedFiles.length === 0 && selectedFiles.length === 0) {
      onComponentOptionChanged(component, 'file', []);
    }

    if (acceptedFiles.length !== 0) {
      const fileData = parsedEnableMultiple ? [...selectedFiles] : [];
      if (parseContent) {
        onComponentOptionChanged(component, 'isParsing', true);
      }
      acceptedFiles.map((acceptedFile) => {
        const acceptedFileData = fileReader(acceptedFile);
        acceptedFileData.then((data) => {
          fileData.push(data);
        });
      });
      setSelectedFiles(fileData);
      onComponentOptionChanged(component, 'file', fileData);
      onEvent('onFileSelected', { component }).then(() => {
        setAccepted(true);
        // eslint-disable-next-line no-unused-vars
        return new Promise(function (resolve, reject) {
          setTimeout(() => {
            setShowSelectedFiles(true);
            setAccepted(false);
            onComponentOptionChanged(component, 'isParsing', false);
            resolve();
          }, 600);
        });
      });
    }

    if (fileRejections.length > 0) {
      handleFileRejection(fileRejections);
    }

    return () => {
      setAccepted(false);
      setShowSelectedFiles(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedFiles.length, fileRejections.length]);

  const clearSelectedFiles = (index) => {
    setSelectedFiles((prevState) => {
      const copy = JSON.parse(JSON.stringify(prevState));
      copy.splice(index, 1);
      return copy;
    });
  };

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setShowSelectedFiles(false);
    }
    onComponentOptionChanged(component, 'file', selectedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  return (
    <section>
      <div className="container" {...getRootProps({ style, className: 'dropzone' })}>
        <input {...getInputProps()} />
        <FilePicker.Signifiers signifier={accepted} feedback={null} cls="spinner-border text-azure p-0" />

        {showSelectedFiles ? (
          <FilePicker.AcceptedFiles width={width - 10} height={height} showFilezone={setShowSelectedFiles}>
            {selectedFiles.map((acceptedFile, index) => (
              <>
                <div key={index} className="col-10">
                  <FilePicker.Signifiers
                    signifier={selectedFiles.length > 0}
                    feedback={acceptedFile.name}
                    cls="text-secondary d-flex justify-content-start file-list mb-2"
                  />
                </div>
                <div className="col-2 mt-0">
                  <button
                    className="btn badge bg-azure-lt"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelectedFiles(index);
                    }}
                  >
                    <img src="/assets/images/icons/trash.svg" width="12" height="12" className="mx-1" />
                  </button>
                </div>
              </>
            ))}
          </FilePicker.AcceptedFiles>
        ) : (
          <FilePicker.Signifiers
            signifier={!isDragAccept && !accepted & !isDragReject}
            feedback={'Drag & drop some files here, or click to select files'}
            cls={`${darkMode ? 'text-secondary' : 'text-dark'} mt-3`}
          />
        )}

        <FilePicker.Signifiers signifier={isDragAccept} feedback={'All files will be accepted'} cls="text-lime mt-3" />

        <FilePicker.Signifiers signifier={isDragReject} feedback={'Files will be rejected!'} cls="text-red mt-3" />
      </div>
    </section>
  );
};

FilePicker.Signifiers = ({ signifier, feedback, cls }) => {
  if (signifier) {
    return <>{feedback === null ? <div className={cls}></div> : <p className={cls}>{feedback}</p>}</>;
  }

  return null;
};

FilePicker.AcceptedFiles = ({ children, width, height, showFilezone }) => {
  const styles = {
    color: '#bdbdbd',
    outline: 'none',
    padding: '5px',
    overflowX: 'hidden',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    width,
    height,
  };
  return (
    <aside style={styles} onClick={() => showFilezone(false)}>
      <span className="text-info">Files</span>
      <div className="row accepted-files">{children}</div>
    </aside>
  );
};

const processCSV = (str, delimiter = ',') => {
  const headers = str.slice(0, str.indexOf('\n')).split(delimiter);
  const rows = str.slice(str.indexOf('\n') + 1).split('\n');

  try {
    const newArray = rows.map((row) => {
      const values = row.split(delimiter);
      const eachObject = headers.reduce((obj, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
      return eachObject;
    });

    return newArray;
  } catch (error) {
    console.log(error);
    handleErrors(error);
  }
};

const processFileContent = (fileType, fileContent) => {
  switch (fileType) {
    case 'text/csv':
      return processCSV(fileContent);

    default:
      break;
  }
};

const parseFileContent = (file, autoDetect = false, parseFileType) => {
  const fileType = file.type.split('/')[1];

  if (autoDetect) {
    return detectParserFile(file);
  } else {
    return fileType === parseFileType;
  }
};

const detectParserFile = (file) => {
  return (
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
};

//? handle bad data in csv parser (e.g. empty cells) OR errors
const handleErrors = (data) => {
  const badData = data.filter((row) => {
    return Object.values(row).some((value) => value === '');
  });

  const errors = data.filter((row) => {
    return Object.values(row).some((value) => value === 'ERROR');
  });

  return [badData, errors];
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 bytes';
  var k = 1000,
    dm = 2,
    sizes = ['Bytes', 'KB', 'MB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
