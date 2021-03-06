const {DOWNLOAD_FEATURES, onDownloadFinished} = require('../actions/wfsdownload');
const {TOGGLE_CONTROL, toggleControl} = require('../actions/controls');
const {error} = require('../actions/notifications');
const Rx = require('rxjs');
const {get} = require('lodash');
const {saveAs} = require('file-saver');
const axios = require('axios');
const FilterUtils = require('../utils/FilterUtils');
const {getByOutputFormat} = require('../utils/FileFormatUtils');

const getWFSFeature = ({url, filterObj = {}, downloadOptions= {}} = {}) => {
    const data = FilterUtils.toOGCFilter(filterObj.featureTypeName, filterObj, filterObj.ogcVersion);
    return Rx.Observable.defer( () =>
        axios.post(url + `?service=WFS&outputFormat=${downloadOptions.selectedFormat}`, data, {
          timeout: 60000,
          responseType: 'arraybuffer',
          headers: {'Content-Type': 'application/xml'}
    }));
};
const getFileName = action => {
    const name = get(action, "filterObj.featureTypeName");
    const format = getByOutputFormat(get(action, "downloadOptions.selectedFormat"));
    if (format && format.extension) {
        return name + "." + format.extension;
    }
    return name;
};
/*
const str2bytes = (str) => {
    var bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
};
*/
module.exports = {
    startFeatureExportDownload: action$ =>
        action$.ofType(DOWNLOAD_FEATURES).switchMap(action =>
            getWFSFeature({
                    url: action.url,
                    downloadOptions: action.downloadOptions,
                    filterObj: {
                        ...action.filterObj,
                        pagination: get(action, "downloadOptions.singlePage") ? action.filterObj.pagination : null
                    }
                })
                .do(({data, headers}) => {
                    if (headers["content-type"] === "application/xml") { // TODO add expected mimetypes in the case you want application/dxf
                        let xml = String.fromCharCode.apply(null, new Uint8Array(data));
                        if (xml.indexOf("<ows:ExceptionReport") === 0 ) {
                            throw xml;
                        }
                    }
                    saveAs(new Blob([data], {type: headers && headers["content-type"]}), getFileName(action));
                })
                .map( () => onDownloadFinished() )
                .catch( () => Rx.Observable.of(
                    error({
                        title: "wfsdownload.error.title",
                        message: "wfsdownload.error.invalidOutputFormat",
                        autoDismiss: 5,
                        position: "tr"
                    }),
                    onDownloadFinished())
                )

        ),
    closeExportDownload: (action$, store) =>
        action$.ofType(TOGGLE_CONTROL)
        .filter((a) => a.control === "queryPanel" && !store.getState().controls.queryPanel.enabled && store.getState().controls.wfsdownload.enabled)
        .switchMap( () => Rx.Observable.of(toggleControl("wfsdownload")))
};
