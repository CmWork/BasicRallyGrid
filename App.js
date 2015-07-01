Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        console.log('Basic Rally Grid');

        var pulldownContainer = Ext.create('Ext.container.Container', {
            itemId: 'pulldown-container',
            layout: {
                type: 'hbox',
                align: 'stretch'
            }
        });
        this.add(pulldownContainer);
        this._loadIterations();
    },
    _loadIterations: function() {
        var iterPicker = Ext.create('Rally.ui.combobox.IterationComboBox', {
            itemId: 'iter-picker',
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
        this.down('#pulldown-container').add(iterPicker);
    },
    _loadFieldValueCb: function() {
        var fieldValueCb = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
            itemId: 'field-value',
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
        this.down('#pulldown-container').add(fieldValueCb);
    },
    _getFilters: function(iterVal, ownerVal) {
        var iterationFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'Iteration',
            operation: '=',
            value: iterVal
        });
        var ownerFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'Owner',
            operation: '=',
            value: ownerVal
        });
        return iterationFilter.and(ownerFilter);
    },
    _loadData: function() {
        var iterRef = this.down('#iter-picker').getRecord().get('_ref');
        var owner = this.down('#field-value').getRecord().get('value');
        console.log('SELECT OWNER: ', owner);
        console.log('iter ref: ', iterRef);

        var comboFilter = this._getFilters(iterRef, owner);

        if (this.myStore) {
            this.myStore.setFilter(comboFilter);
            this.myStore.load();
        } else {
            this.myStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'User Story',
                autoLoad: true,
                filters: comboFilter,
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
