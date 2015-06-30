Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        console.log('Basic Rally Grid')
        this._loadData()
    },
    _loadData: function() {
        var myStore = Ext.create('Rally.data.wsapi.Store', {
            model: 'User Story',
            autoLoad: true,
            listeners: {
                load: function(store, data, success) {
                    console.log('get data: ', store, data, success)
                    this._loadGrid(store)
                },
                scope: this
            },
            fetch: ['FormattedID', 'Name', 'Owner', 'ScheduleState']
        });
    },
    _loadGrid: function(store) {
        var mygrid = Ext.create('Ext.Container', {
             items: [{
                 xtype: 'rallygrid',
                 columnCfgs: [
                     'FormattedID',
                     'Name',
                     'Owner'
                 ],
                 storeConfig: {
                     model: 'userstory'
                 }
             }],
             renderTo: Ext.getBody()
        });

        console.log('my grid: ', mygrid)
        this.add(mygrid)
    }
});
