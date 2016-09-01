/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

var GeoStoreApi = require('../api/GeoStoreDAO');
const ConfigUtils = require('../utils/ConfigUtils');
const assign = require('object-assign');
const {get, head} = require('lodash');

const MAPS_LIST_LOADED = 'MAPS_LIST_LOADED';
const MAPS_LIST_LOADING = 'MAPS_LIST_LOADING';
const MAPS_LIST_LOAD_ERROR = 'MAPS_LIST_LOAD_ERROR';
const MAP_UPDATING = 'MAP_UPDATING';
const MAP_METADATA_UPDATED = 'MAP_METADATA_UPDATED';
const MAP_UPDATED = 'MAP_UPDATED';
const MAP_CREATED = 'MAP_CREATED';
const MAP_DELETING = 'MAP_DELETING';
const MAP_DELETED = 'MAP_DELETED';
const MAP_SAVED = 'MAP_SAVED';
const ATTRIBUTE_UPDATED = 'ATTRIBUTE_UPDATED';
const THUMBNAIL_DELETED = 'THUMBNAIL_DELETED';
const PERMISSIONS_LIST_LOADING = 'PERMISSIONS_LIST_LOADING';
const PERMISSIONS_LIST_LOADED = 'PERMISSIONS_LIST_LOADED';

function mapsLoading(searchText, params) {
    return {
        type: MAPS_LIST_LOADING,
        searchText,
        params
    };
}

function mapsLoaded(maps, params, searchText) {
    return {
        type: MAPS_LIST_LOADED,
        params,
        maps,
        searchText
    };
}

function loadError(e) {
    return {
        type: MAPS_LIST_LOAD_ERROR,
        error: e
    };
}
function mapCreated(resourceId, metadata, content, error) {
    return {
        type: MAP_CREATED,
        resourceId,
        metadata,
        content,
        error
    };
}

function mapUpdating(resourceId) {
    return {
        type: MAP_UPDATING,
        resourceId
    };
}

function mapUpdated(resourceId, content, result, error) {
    return {
        type: MAP_UPDATED,
        resourceId,
        content,
        result,
        error
    };
}

function mapMetadataUpdated(resourceId, newName, newDescription, result, error) {
    return {
        type: MAP_METADATA_UPDATED,
        resourceId,
        newName,
        newDescription,
        result,
        error
    };
}

function mapDeleted(resourceId, result, error) {
    return {
        type: MAP_DELETED,
        resourceId,
        result,
        error
    };
}

function mapDeleting(resourceId, result, error) {
    return {
        type: MAP_DELETING,
        resourceId,
        result,
        error
    };
}

function thumbnailDeleted(resourceId, result, error) {
    return {
        type: THUMBNAIL_DELETED,
        resourceId,
        result,
        error
    };
}

function attributeUpdated(resourceId, name, value, type, error) {
    return {
        type: ATTRIBUTE_UPDATED,
        resourceId,
        name,
        value,
        error
    };
}

function permissionsLoading(mapId) {
    return {
        type: PERMISSIONS_LIST_LOADING,
        mapId
    };
}

function permissionsLoaded(permissions, mapId) {
    return {
        type: PERMISSIONS_LIST_LOADED,
        permissions,
        mapId
    };
}

function loadMaps(geoStoreUrl, searchText="*", params={start: 0, limit: 20}) {
    return (dispatch) => {
        let opts = {params, baseURL: geoStoreUrl };
        dispatch(mapsLoading(searchText, params));
        GeoStoreApi.getResourcesByCategory("MAP", searchText, opts).then((response) => {
            dispatch(mapsLoaded(response, params, searchText));
        }).catch((e) => {
            dispatch(loadError(e));
        });
    };
}

function loadPermissions(/*geoStoreUrl,*/ mapId) {
    return (dispatch) => {
        // let opts = {baseURL: geoStoreUrl };
        dispatch(permissionsLoading(mapId));
        GeoStoreApi.getPermissions(mapId, {}/*opts*/).then((response) => {
            dispatch(permissionsLoaded(response, mapId));
        }).catch((e) => {
            dispatch(loadError(e));
        });
    };
}

function updateMap(resourceId, content, options) {
    return (dispatch) => {
        dispatch(mapUpdating(resourceId, content));
        GeoStoreApi.putResource(resourceId, content, options).then(() => {
            dispatch(mapUpdated(resourceId, content, "success"));
        }).catch((e) => {
            dispatch(loadError(e));
        });
    };
}

function updatePermissions(resourceId, canRead, canWrite, group, options) {
    return () => {
        GeoStoreApi.postPermissions(resourceId, canRead, canWrite, group, options);
    };
}

function updateAttribute(resourceId, name, value, type, options) {
    return (dispatch) => {
        GeoStoreApi.putResourceAttribute(resourceId, name, value, type, options).then(() => {
            dispatch(attributeUpdated(resourceId, name, value, type, "success"));
        }).catch((e) => {
            dispatch(attributeUpdated(resourceId, name, value, type, "failure", e));
        });
    };
}

function createThumbnail(nameThumbnail, dataThumbnail, categoryThumbnail, resourceIdMap, options) {
    return (dispatch, getState) => {
        let metadata = {
            name: nameThumbnail
        };
        dispatch(mapUpdating(resourceIdMap));
        return GeoStoreApi.postResource(metadata, dataThumbnail, categoryThumbnail, options).then((response) => {
            let state = getState();
            let groups = get(state, "security.user.groups.group");
            let group = head(Array.isArray(groups) ? groups : [groups], (g) => (g.groupName === "everyone"));
            dispatch(updatePermissions(response.data, true, false, group, options)); // UPDATE resource permissions
            const thumbnailUrl = ConfigUtils.getDefaults().geoStoreUrl + "data/" + response.data + "/raw?decode=datauri";
            const encodedThumbnailUrl = encodeURIComponent(encodeURIComponent(thumbnailUrl));
            dispatch(updateAttribute(resourceIdMap, "thumbnail", encodedThumbnailUrl, "STRING", options)); // UPDATE resource map with new attribute
        });
    };
}

// TODO check why it returns and a failure essage
function deleteThumbnail(resourceId, mapId, options) {
    return (dispatch) => {
        GeoStoreApi.deleteResource(resourceId, options).then(() => {
            if (mapId) {
                dispatch(updateAttribute(mapId, "thumbnail", "NODATA", "STRING", options));
            }
            dispatch(thumbnailDeleted(resourceId, "success"));
        }).catch((e) => {
            dispatch(thumbnailDeleted(resourceId, "failure", e));
        });
    };
}

function updateMapMetadata(resourceId, newName, newDescription, options) {
    return (dispatch) => {
        dispatch(mapUpdating(resourceId));
        GeoStoreApi.putResourceMetadata(resourceId, newName, newDescription, options).then(() => {
            dispatch(mapMetadataUpdated(resourceId, newName, newDescription, "success"));
        }).catch((e) => {
            dispatch(mapMetadataUpdated(resourceId, newName, newDescription, "failure", e));
        });
    };
}

function createMap(metadata, content, thumbnail, options) {
    return (dispatch) => {
        GeoStoreApi.postResource(metadata, content, "MAP", options).then((response) => {
            let resourceId = response.data;
            if (thumbnail && thumbnail.data) {
                dispatch(createThumbnail(thumbnail.name, thumbnail.data, thumbnail.category, resourceId, options));
            }
            dispatch(mapCreated(response.data, assign({id: response.data, canDelete: true, canEdit: true, canCopy: true}, metadata), content));
        }).catch((e) => {
            dispatch(loadError(e));
        });
    };
}

function deleteMap(resourceId, options) {
    return (dispatch) => {
        dispatch(mapDeleting(resourceId));
        GeoStoreApi.deleteResource(resourceId, options).then(() => {
            dispatch(mapDeleted(resourceId, "success"));
        }).catch((e) => {
            dispatch(mapDeleted(resourceId, "failure", e));
        });
    };
}

module.exports = {
    MAPS_LIST_LOADED, MAPS_LIST_LOADING, MAPS_LIST_LOAD_ERROR, MAP_CREATED, MAP_UPDATING, MAP_UPDATED, MAP_DELETED, MAP_DELETING, MAP_SAVED, ATTRIBUTE_UPDATED, THUMBNAIL_DELETED,
    PERMISSIONS_LIST_LOADING, PERMISSIONS_LIST_LOADED,
    loadMaps, updateMap, updateMapMetadata, mapMetadataUpdated, deleteMap, deleteThumbnail, createThumbnail,
    createMap, loadError, loadPermissions
};
