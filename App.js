Ext.define('CustomApp', {
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
        console.log('iter ref: ', iterRef);

        var comboFilter = this._getFilters(iterRef);

        if (this.myStore) {
            this.myStore.setFilter(comboFilter);
            this.myStore.load();
        } else {
            this.myStore = Ext.create('Rally.data.wsapi.artifact.Store', {
                models: ['User Story', 'Defect'],
                autoLoad: true,
                filters: comboFilter,
                listeners: {
                    load: function(store, data, success) {
                        console.log(store)
                        var htmlStr = this._getArtifactHtml(store.getRecords());
                        if (!this.mytext) {
                            this._createText(htmlStr);
                        }
                        this._setText(htmlStr);
                    },
                    scope: this
                },
                fetch: ['FormattedID', 'Name', 'Owner', 'ScheduleState', 'PlanEstimate', 'RevisionHistory']
            });
        }
    },
    _createText: function(string) {
        this.mytext = {
            itemId: 'texted',
            xtype: 'rallyrichtexteditor',
            value: string,
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
    _getArtifactHtml: function(records) {
        var htmlStr = '';
        Ext.Array.each(records, function(rec) {
            pEst = rec.get('PlanEstimate');
            state = rec.get('ScheduleState');

            recStr = rec.get('FormattedID') + ': ' + rec.get('Name');

            if (pEst && pEst > 0) {
                recStr = recStr + ' (' + pEst + 'pts)';
            } else {
                if (schState && schState == 'Incomplete') {
                    // Use revision history to get old status
                    revHis = rec.getProxy('RevisionHistory');
                    console.log(revHis);
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
        });
        return htmlStr;
    }
});
