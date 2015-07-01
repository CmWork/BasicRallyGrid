Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        console.log('Basic Rally Grid');

        this.pulldownContainer = Ext.create('Ext.container.Container', {
            layout: {
                type: 'hbox',
                align: 'stretch'
            }
        });
        this.add(this.pulldownContainer);
        this._loadIterations();
    },
    _loadIterations: function() {
        this.iterPicker = Ext.create('Rally.ui.combobox.IterationComboBox', {
            fieldLabel: 'Iteration',
            labelAlign: 'right',
            width: '300',
            listeners: {
                ready: function(comboBox) {
                    //this._loadData()
                    this._loadFieldValueCb();
                },
                select: function(comboBox, records) {
                    this._loadData();
                },
                scope: this
            }
        });
        this.pulldownContainer.add(this.iterPicker);
    },
    _loadFieldValueCb: function() {
        this.fieldValueCb = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
            fieldLabel: 'Owner',
            labelAlign: 'right',
            model: 'User Story',
            field: 'Owner',
            listeners: {
                ready: function(comboBox) {
                    this._loadData();
                },
                select: function(comboBox, records) {
                    this._loadData();
                },
                scope: this
            }
        });
        this.pulldownContainer.add(this.fieldValueCb);
    },
    _loadData: function() {
        var iterRef = this.iterPicker.getRecord().get('_ref');
        var owner = this.fieldValueCb.getRecord().get('value');
        console.log('SELECT OWNER: ', owner);
        console.log('iter ref: ', iterRef);

        var myFilters = [
            {
                property: 'Iteration',
                operation: '=',
                value: iterRef
            },{
                property: 'Owner',
                operation: '=',
                value: owner
            }
        ];

        if (this.myStore) {
            this.myStore.setFilter(myFilters);
            this.myStore.load();
        } else {
            this.myStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'User Story',
                autoLoad: true,
                filters: myFilters,
                listeners: {
                    load: function(store, data, success) {
                        console.log('store: ', store);
                        if (!this.mygrid) {
                            this._createGrid(store);
                        }
                    },
                    scope: this
                },
                fetch: ['FormattedID', 'Name', 'Owner', 'ScheduleState']
            });
            console.log('myStore: ', this.myStore);
        }
    },
    _createGrid: function(store) {
        this.mygrid = Ext.create('Rally.ui.grid.Grid', {
            store: store,
            columnCfgs: [
                'FormattedID',
                'Name',
                'Owner'
            ]
        });
        console.log('my grid: ', this.mygrid);
        this.add(this.mygrid);
    }
});
