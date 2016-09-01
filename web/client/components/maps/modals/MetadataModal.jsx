/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {Table} = require('react-bootstrap');
const Metadata = require('../forms/Metadata');
const Thumbnail = require('../forms/Thumbnail');

// TODO: move in form/Choice
const Choice = require('../../print/Choice');

require('./css/modals.css');

const {Modal, Button, Glyphicon, Grid, Row, Col} = require('react-bootstrap');
const Message = require('../../I18N/Message');

const Dialog = require('../../../components/misc/Dialog');
const assign = require('object-assign');

const Spinner = require('react-spinkit');
const LocaleUtils = require('../../../utils/LocaleUtils');
// const ConfigUtils = require('../../../utils/ConfigUtils');


  /**
   * A Modal window to show map metadata form
   */
const MetadataModal = React.createClass({
    propTypes: {
        // props
        id: React.PropTypes.string,
        user: React.PropTypes.object,
        authHeader: React.PropTypes.string,
        show: React.PropTypes.bool,
        options: React.PropTypes.object,
        loadPermissions: React.PropTypes.func,
        onSave: React.PropTypes.func,
        onCreateThumbnail: React.PropTypes.func,
        onDeleteThumbnail: React.PropTypes.func,
        onGroupsChange: React.PropTypes.func,
        onClose: React.PropTypes.func,
        useModal: React.PropTypes.bool,
        closeGlyph: React.PropTypes.string,
        buttonSize: React.PropTypes.string,
        includeCloseButton: React.PropTypes.bool,
        map: React.PropTypes.object,
        style: React.PropTypes.object,
        fluid: React.PropTypes.bool,
        displayPermissionEditor: React.PropTypes.bool,
        availablePermissions: React.PropTypes.arrayOf(React.PropTypes.string),
        groups: React.PropTypes.arrayOf(React.PropTypes.object)
    },
    contextTypes: {
        messages: React.PropTypes.object
    },
    getDefaultProps() {
        return {
            id: "MetadataModal",
            loadPermissions: () => {},
            onSave: ()=> {},
            onCreateThumbnail: ()=> {},
            onDeleteThumbnail: ()=> {},
            onGroupsChange: ()=> {},
            user: {
                name: "Guest"
            },
            onClose: () => {},
            options: {},
            useModal: true,
            closeGlyph: "",
            includeCloseButton: true,
            fluid: true,
            displayPermissionEditor: true,
            availablePermissions: ["canRead", "canWrite"],
            groups: [/*
                { name: "hey", permission: "canRead" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "yeah", permission: "canWrite" },
                { name: "it's a very long list", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "oh!", permission: "canWrite" },
                { name: "last", permission: "canWrite" }
                */]
        };
    },
    setMapNameValue(newName) {
        if (this.refs.mapMetadataForm) {
            this.refs.mapMetadataForm.setMapNameValue(newName);
        }
    },
    componentDidMount() {
        // this.loadPermissions();
    },
    componentWillReceiveProps(nextProps) {
        if ( !nextProps.map.loading && this.state && this.state.saving) {
            this.setState({
                saving: false
            });
            this.props.onClose();
        }
        if (!this.props.show && nextProps.show) {
            this.loadPermissions();
        }
    },
    updateThumbnail() {
        this.refs.thumbnail.updateThumbnail();
    },
    loadPermissions() {
        this.props.loadPermissions(/*ConfigUtils.getDefaults().geoStoreUrl, */this.props.map.id);
    },
    onSave() {
        if ( this.isMetadataChanged() ) {
            let name = this.refs.mapMetadataForm.refs.mapName.getValue();
            let description = this.refs.mapMetadataForm.refs.mapDescription.getValue();
            this.props.onSave(this.props.map.id, name, description);
        }
    },
    onChangePermission(index, input) {
        console.log("input: " + input + "\naltro: " + index);
        this.localGroups[index].permission = input;
        this.props.onGroupsChange(this.localGroups);
    },
    renderPermissionEditor() {
        if (this.props.displayPermissionEditor) {
            if (this.props.map && this.props.map.permissions && this.props.map.permissions.SecurityRuleList && this.props.map.permissions.SecurityRuleList.SecurityRule) {
                this.localGroups = this.props.map.permissions.SecurityRuleList.SecurityRule.map(function(rule) {
                        if (rule && rule.group && rule.canRead) {
                            return {name: rule.group.groupName, permission: rule.canWrite ? "canWrite" : "canRead" };
                        }
                    }
                ).filter(rule => rule);  // filter out undefined values
            } else {
                this.localGroups = this.props.groups;
            }
            return (
                <div>
                    <b
                        style={{cursor: "default"}}
                        onClick={this.loadPermissions}
                        ><Message msgId="groups" /> <Message msgId="permissions" /></b>
                    <Table className="permissions-table" bordered condensed hover>
                        <thead>
                            <tr>
                                <th><Message msgId="group" /></th>
                                <th><Message msgId="permission" /></th>
                                {
                                    // <th><Message msgId="groupEdit" /></th>
                                }
                                <th><Message msgId="permissionDelete" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.localGroups.map((group, index) => {
                                return (
                                    <tr key ={index} className={index / 2 === 0 ? "even" : "odd"}>
                                        <td>{group.name}</td>
                                        <td>
                                            <Choice
                                                ref="permChoise"
                                                onChange={this.onChangePermission.bind(this, index)}
                                                label=""
                                                items={this.props.availablePermissions.map((perm) => ({name: perm, value: perm}))}
                                                selected={group.permission}/>
                                        </td>
                                        {
                                            // <td><Button bsStyle="primary" className="square-button"><Glyphicon glyph="1-group-mod"/></Button></td>
                                        }
                                        <td><Button bsStyle="danger" className="square-button"><Glyphicon glyph="1-close"/></Button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            );
        }
    },
    renderLoading() {
        return this.props.map && this.props.map.updating ? <Spinner spinnerName="circle" key="loadingSpinner" noFadeIn/> : null;
    },
    render() {
        const footer = (<span role="footer"><div style={{"float": "left"}}>{this.renderLoading()}</div>
        <Button
            ref="metadataSaveButton"
            key="metadataSaveButton"
            bsStyle="primary"
            bsSize={this.props.buttonSize}
            onClick={() => {
                this.setState({
                    saving: true
                });
                this.updateThumbnail();
                this.onSave();
            }}><Message msgId="save" /></Button>
        {this.props.includeCloseButton ? <Button
            key="closeButton"
            ref="closeButton"
            bsSize={this.props.buttonSize}
            onClick={this.props.onClose}><Message msgId="close" /></Button> : <span/>}
        </span>);
        const body = (
            <Metadata role="body" ref="mapMetadataForm"
                onChange={() => {
                    this.setState({metadataValid: this.refs.mapMetadataForm.isValid()});
                }}
                map={this.props.map}
                nameFieldText={<Message msgId="map.name" />}
                descriptionFieldText={<Message msgId="map.description" />}
                namePlaceholderText={LocaleUtils.getMessageById(this.context.messages, "map.namePlaceholder") || "Map Name"}
                descriptionPlaceholderText={LocaleUtils.getMessageById(this.context.messages, "map.descriptionPlaceholder") || "Map Description"}
            />);
        return this.props.useModal ? (
            <Modal {...this.props.options}
                show={this.props.show}
                onHide={this.props.onClose}
                id={this.props.id}>
                <Modal.Header key="mapMetadata" closeButton>
                    <Modal.Title>
                        <Message msgId="manager.editMapMetadata" />
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid fluid={this.props.fluid}>
                        <Row>
                            <Col xs={7}>
                                <Thumbnail
                                    onCreateThumbnail={this.props.onCreateThumbnail}
                                    onDeleteThumbnail={this.props.onDeleteThumbnail}
                                    map={this.props.map}
                                    ref="thumbnail"/>
                            </Col>
                            <Col xs={5}>
                                {body}
                            </Col>
                        </Row>
                        {this.renderPermissionEditor()}
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                  {footer}
                </Modal.Footer>
            </Modal>) : (
            <Dialog id="mapstore-mapmetadata-panel" style={assign({}, this.props.style, {display: this.props.show ? "block" : "none"})}>
                <span role="header"><span className="mapmetadata-panel-title"><Message msgId="manager.editMapMetadata" /></span><button onClick={this.props.onClose} className="login-panel-close close">{this.props.closeGlyph ? <Glyphicon glyph={this.props.closeGlyph}/> : <span>×</span>}</button></span>
                {body}
                {footer}
            </Dialog>
        );
    },
    isMetadataChanged() {
        return this.props.map && (
            this.refs.mapMetadataForm.refs.mapDescription.getValue() !== this.props.map.description ||
            this.refs.mapMetadataForm.refs.mapName.getValue() !== this.props.map.name
        );
    }
});

module.exports = MetadataModal;
