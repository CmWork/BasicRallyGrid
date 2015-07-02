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
            type: 'hbox',
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
                        var htmlStr = this._getArtifactHtml(store.getRecords());
                        console.log(htmlStr)
                        if (!this.mytext) {
                            this._createText(htmlStr);
                        }
                        this._setText(htmlStr)
                    },
                    scope: this
                },
                fetch: ['FormattedID', 'Name', 'Owner', 'ScheduleState', 'PlanEstimate', 'RevisionHistory']
            });
            console.log('myStore: ', this.myStore);
        }
    },
    _createText: function(string) {
        this.mytext = {
            itemId: 'texted',
            xtype: 'rallyrichtexteditor',
            height: '400',
            width: '500',
            value: string
        };
        this.down('#text-container').add(this.mytext);
    },
    _setText: function(string) {
        this.down('#texted').setValue(string)
    },
    _getArtifactHtml: function(records) {
        var htmlStr = '';
        Ext.Array.each(records, function(rec) {
            recStr = rec.get('FormattedID') + ': ' + rec.get('Name')
            pEst = rec.get('PlanEstimate')
            if (pEst && pEst > 0) {
                recStr = recStr + ' (' + pEst + 'pts)'
            }
            schState = rec.get('ScheduleState');
            if (schState == 'Accepted' || schState == 'Completed') {
                htmlStr = htmlStr + '<font color="green">' + recStr + '</font><BR>'
            } else if (schState == 'Incomplete') {
                htmlStr = htmlStr + '<font color="red">' + recStr + '</font><BR>'
            } else {
                htmlStr = htmlStr + recStr + '<BR>'
            }
            console.log(rec.get('FormattedID'));
            console.log(rec.get('Name'));
            console.log(rec.get('Owner'));
            console.log(rec.get('ScheduleState'));
            console.log(rec.get('PlanEstimate'));
            console.log(rec.get('RevisionHistory'));
        });
        return htmlStr;
    }
});
