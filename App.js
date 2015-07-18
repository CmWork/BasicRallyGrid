Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: { type: 'hbox' },
    defaults: { padding: 10 },
    items: [
        {xtype: 'container',itemId:'render_example', flex: 1},
        {xtype: 'container',itemId:'line_by_line_example', flex: 1}
    ],
    launch: function() {
        this._getSomeStories();
    },
    _getSomeStories: function() {
        if ( this.render_grid ) { this.render_grid.destroy(); }
        if ( this.line_grid ) { this.line_grid.destroy(); }
        Ext.create('Rally.data.WsapiDataStore',{
            autoLoad: true,
            model: 'User Story',
            fetch: ['RevisionHistory','Revisions','FormattedID','Name','RevisionNumber','CreationDate','User'],
            listeners: {
                load: function(store,data,success) {
                    this._showRenderedGrid(store);
                    this._prepareLineByLineGrid(data);
                },
                scope: this
            }
        });
    },
    /* formats data for the revision history cell */
    _revisionRenderer: function(value) {
        var formatted_value_array = [];
        if ( value.Revisions ) {
            Ext.Array.each( value.Revisions, function(rev){
                    formatted_value_array.push( rev.RevisionNumber + " on " + rev.CreationDate + " by " + rev.User._refObjectName );
            });
        }
        return formatted_value_array.join("<br/>");
    },
    _showRenderedGrid: function(store) {
        if ( this.render_grid ) { this.render_grid.destroy(); }
        this.render_grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            columnCfgs: [
                { text: 'ID', dataIndex: 'FormattedID' },
                { text: 'Name', dataIndex: 'Name' },
                { text: 'Revs', dataIndex: 'RevisionHistory', renderer: this._revisionRenderer, flex: 1}
            ]
        });
        this.down('#render_example').add(this.render_grid);
    },
    _prepareLineByLineGrid: function(data) {
        var lines = [];
        /* TODO: see if this is what a TransformStore might be good for? */
        Ext.Array.each(data,function(item) {
            Ext.Array.each(item.get('RevisionHistory').Revisions, function(rev){
                var line = {
                    FormattedID: item.get('FormattedID'),
                    Name: item.get('Name'),
                    RevisionNumber: rev.RevisionNumber,
                    RevisionDate: rev.CreationDate,
                    RevisionAuthor: rev.User._refObjectName
                };
                lines.push(line);
            });
        });
        /* could be much more compact, but I like to separate the data gathering from the data display */
        Ext.create('Rally.data.custom.Store',{
            autoLoad: true,
            data: lines,
            listeners: {
                load: function(store,data,success) {
                    this._showLineByLineGrid(store);
                },
                scope: this
            }
        });
    },
    _showLineByLineGrid: function(store) {
        if ( this.line_grid ) { this.line_grid.destroy(); }
        this.line_grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            columnCfgs: [
                { text: 'ID', dataIndex: 'FormattedID' },
                { text: 'Name', dataIndex: 'Name' },
                { text: 'id', dataIndex: 'RevisionNumber'},
                { text: 'date', dataIndex: 'RevisionDate', flex: 1 },
                { text: 'author', dataIndex: 'RevisionAuthor' }
            ]
        });
        this.down('#line_by_line_example').add(this.line_grid);
    }
});Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items: [{
        xtype: 'container',
        itemId: 'pulldown-container',
        layout: {
            type: 'hbox',
            align: 'stretch'
        }
    },{
        xtype: 'container',
        itemId: 'text-container',
        layout: {
            type: 'anchor',
            align: 'stretch'
        }
    }],
    launch: function() {
        console.log('Basic Rally Grid');
        this._loadIterations();
    },
    _loadIterations: function() {
        var iterPicker = {
            xtype: 'rallyiterationcombobox',
            itemId: 'iter-picker',
            fieldLabel: 'Iteration',
            labelAlign: 'right',
            width: '300',
            listeners: {
                ready: this._loadData,
                select: this._loadData,
                scope: this
            }
        };
        this.down('#pulldown-container').add(iterPicker);
    },
    _getFilters: function(iterVal) {
        var iterationFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'Iteration',
            operation: '=',
            value: iterVal
        });
        return iterationFilter;
    },
    _loadData: function() {
        var iterRef = this.down('#iter-picker').getRecord().get('_ref');

        var comboFilter = this._getFilters(iterRef);

        if (this.myStore) {
            this.myStore.setFilter(comboFilter);
            this.myStore.load();
        } else {
            this.myStore = Ext.create('Rally.data.wsapi.artifact.Store', {
                models: ['UserStory','Defect'],
                autoLoad: true,
                filters: comboFilter,
                listeners: {
                    load: function(store, stories) {
                        if (!this.mytext) {
                           this._createText(stories);
                        }
                        console.log('loadData -> getArtifactHtml');
                        this._getArtifactHtml(stories);
                    },
                    scope: this
                },
                fetch: ['FormattedID', 'Name', 'Owner', 'ScheduleState', 'PlanEstimate', 'Description', 'RevisionHistory', 'Revisions', 'RevisionNumber']
            });
        }
    },
    _createText: function(stories) {
        this.mytext = {
            itemId: 'texted',
            xtype: 'rallyrichtexteditor',
            style: {
                width: '100%',
                height: '100%'
            }
        };
        this.down('#text-container').add(this.mytext);
    },
    _setText: function(string) {
        this.down('#texted').setValue(string);
    },
    _getText: function() {
        return this.down('#texted').getValue();
    },
    _loadRevHistoryModel: function(model, story, usStr){
        console.log("LOAD MODEL:");
        var pEst = 123;
        model.load(Rally.util.Ref.getOidFromRef(story.get('RevisionHistory')), {
            success: function(record) {
                record.getCollection('Revisions').load({
                    fetch: ['Description'],
                    scope: this,
                    callback: function(revisions) {
                        var re = /PLAN ESTIMATE changed from \[(\d.\d) Points\] to \[(\d.\d) Points\]/;
                        Ext.Array.each(revisions, function (rev) {
                            matches = rev.data.Description.match(re);
                            if (matches) {
                                matches = matches.splice(1);
                                if (matches[0] > 0) {
                                    console.log('3-' + pEst + ' ' + usStr);
                                    pEst = matches[0];
                                    console.log('4-' + pEst + ' ' + usStr);
                                }
                            }
                        }, this);
                        console.log('5-' + pEst + ' ' + usStr);
                    }
                }, this);
                console.log(pEst + ' ' + usStr);
            }
        }, this);
        return pEst;
    },
    _getArtifactHtml: function(data) {
        var htmlStr = '';
        Ext.Array.each(data, function(rec) {
            revHisModel = Rally.data.ModelFactory.getModel({
                type: 'RevisionHistory',
                success: function(model) {
                    pEst = rec.get('PlanEstimate');
                    state = rec.get('ScheduleState');

                    recStr = rec.get('FormattedID') + ': ' + rec.get('Name');

                    if (pEst && pEst > 0) {
                        recStr = recStr + ' (' + pEst + 'pts)';
                    } else {
                        if (state && state == 'Incomplete') {
                            console.log('getArt -> loadRevHistory ' + recStr);
                            pEst = this._loadRevHistoryModel(model, rec, recStr);
                            recStr = recStr + ' (' + pEst + 'pts)';
                        }
                    }

                    if (state == 'Accepted' || state == 'Completed') {
                        htmlStr = htmlStr + '<font color="green">' + recStr + '</font><BR>';
                    } else if (state == 'Incomplete') {
                        htmlStr = htmlStr + '<font color="red">' + recStr + '</font><BR>';
                    } else {
                        htmlStr = htmlStr + recStr + '<BR>';
                    }
                    console.log("SET TEXT");
                    this._setText(htmlStr);
                },
                scope: this
            }, this);
        }, this);
        console.log("END _getArtifactHtml");
    }
});
