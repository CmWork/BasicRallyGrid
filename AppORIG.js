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
                ready: this._loadFieldValueCb,
                select: this._loadData,
                scope: this
            }
        };
        this.down('#pulldown-container').add(iterPicker);
    },
    _loadFieldValueCb: function() {
        var fieldValueCb = {
            xtype: 'rallyfieldvaluecombobox',
            itemId: 'field-value',
            fieldLabel: 'Owner',
            labelAlign: 'right',
            model: 'User Story',
            field: 'Owner',
            listeners: {
                ready: this._loadData,
                select: this._loadData,
                scope: this
            }
        };
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
        this.mygrid = {
            xtype: 'rallygrid',
            store: store,
            columnCfgs: [
                'FormattedID',
                'Name',
                'Owner'
            ]
        };
        console.log('my grid: ', this.mygrid);
        this.add(this.mygrid);
    }
});
