/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const Message = require('../I18N/Message');
const GridCard = require('../misc/GridCard');
const thumbUrl = require('./style/default.png');
const assign = require('object-assign');
const {connect} = require('react-redux');
const {loadPermissions} = require('../../actions/maps');

const MetadataModal = connect(
    (state = {}) => ({
        availableGroups: state.security && state.security.user && state.security.user.groups && state.security.user.groups.group || [ ] // TODO: add message when array is empty
        // permissions: state.controls && state.controls.metadatamodal && state.controls.metadatamodal.groups || [ ]  // TODO: add message when array is empty
    }),
    { loadPermissions }, null, {withRef: true} )(require('./modals/MetadataModal'));
const ConfirmModal = require('./modals/ConfirmModal');

require("./style/mapcard.css");

const MapCard = React.createClass({
    propTypes: {
        style: React.PropTypes.object,
        map: React.PropTypes.object,
        viewerUrl: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.func]),
        onSave: React.PropTypes.func,
        onCreateThumbnail: React.PropTypes.func,
        onDeleteThumbnail: React.PropTypes.func,
        onMapDelete: React.PropTypes.func,
        mapType: React.PropTypes.string
    },
    getDefaultProps() {
        return {
            onCreateThumbnail: ()=> {},
            onDeleteThumbnail: ()=> {},
            onSave: ()=> {},
            onMapDelete: ()=> {},
            style: {
                backgroundImage: 'url(' + thumbUrl + ')',
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "repeat-x"
            }
        };
    },
    getInitialState() {
        return {
            displayMetadataEdit: false
        };
    },
    onEdit: function(map) {
        this.refs.metadataModal.getWrappedInstance().setMapNameValue(map.name);
        this.open();
    },
    onConfirmDelete() {
        this.props.onMapDelete(this.props.map.id);
        this.close();
    },
    getCardStyle() {
        if (this.props.map.thumbnail) {
            return assign({}, this.props.style, {
                backgroundImage: 'url(' + (this.props.map.thumbnail === "NODATA" ? thumbUrl : decodeURIComponent(this.props.map.thumbnail)) + ')'
            });
        }
        return this.props.style;
    },
    render: function() {

        var availableAction = [{
            onClick: (evt) => {this.stopPropagate(evt); this.props.viewerUrl(this.props.map); },
            glyph: "chevron-right",
            tooltip: <Message msgId="manager.openInANewTab" />
        }];

        if (this.props.map.canEdit === true) {
            availableAction.push({
                 onClick: (evt) => {this.stopPropagate(evt); this.onEdit(this.props.map); },
                 glyph: "wrench",
                 disabled: this.props.map.updating,
                 loading: this.props.map.updating,
                 tooltip: <Message msgId="manager.editMapMetadata" />
         }, {
                 onClick: (evt) => {this.stopPropagate(evt); this.displayDeleteDialog(); },
                 glyph: "remove-circle",
                 disabled: this.props.map.deleting,
                 loading: this.props.map.deleting,
                 tooltip: <Message msgId="manager.deleteMap" />
         });
        }
        return (
           <GridCard className="map-thumb" style={this.getCardStyle()} header={this.props.map.title || this.props.map.name} actions={availableAction}>
               <div className="map-thumb-description">{this.props.map.description}</div>
               <MetadataModal ref="metadataModal" show={this.state.displayMetadataEdit} onHide={this.close} onClose={this.close} map={this.props.map} onSave={this.props.onSave} onDeleteThumbnail={this.props.onDeleteThumbnail} onCreateThumbnail={this.props.onCreateThumbnail}/>
               <ConfirmModal ref="deleteMapModal" show={this.state.displayDeleteDialog} onHide={this.close} onClose={this.close} onConfirm={this.onConfirmDelete} titleText={<Message msgId="manager.deleteMap" />} confirmText={<Message msgId="manager.deleteMap" />} cancelText={<Message msgId="cancel" />} body={<Message msgId="manager.deleteMapMessage" />} />
           </GridCard>
        );
    },
    stopPropagate(event) {
        // prevent click on parent container
        const e = event || window.event || {};
        e.cancelBubble = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    },
    close() {
        this.setState({
            displayMetadataEdit: false,
            displayDeleteDialog: false
        });
    },
    open() {
        this.setState({
            displayMetadataEdit: true
        });
    },
    displayDeleteDialog() {
        this.setState({
            displayDeleteDialog: true
        });
    }
});

module.exports = MapCard;
