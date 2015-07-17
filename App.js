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
                        // revModel = Rally.data.ModelFactory.getModel({
                        //     type: 'RevisionHistory',
                        //     success: function(model) {
                        //         model.load(Rally.util.Ref.getOidFromRef(stories[0].get('RevisionHistory')), {
                        //             success: function(record) {
                        //                 console.log('NEW WAAY');
                        //                 console.log(record);
                        //                 // record.getCollection('Revisions').load({
                        //                 //     fetch: ['Description'],
                        //                 //     scope: this,
                        //                 //     callback: function(revisions) {
                        //                 //         console.log(revisions);
                        //                 //     }
                        //                 // });
                        //             }
                        //         });
                        //     }
                        // });

                        if (!this.mytext) {
                           this._createText(stories);
                        }
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
            },
            listeners: {
                ready: this._getArtifactHtml,
                scope: this
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
    _loadRevHistoryModel: function(model, story){
        console.log("LOAD MODEL:");
        model.load(Rally.util.Ref.getOidFromRef(story.get('RevisionHistory')), {
            success: function(record) {
                record.getCollection('Revisions').load({
                    fetch: ['Description'],
                    scope: this,
                    callback: function(revisions) {
                        console.log(revisions);
                    }
                });
            }
        });
        return 1000;
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
                            // Use revision history to get old status

                                // revModel = Rally.data.ModelFactory.getModel({
                                //     type: 'RevisionHistory',
                                //     success: function(model) {
                                //         model.load(Rally.util.Ref.getOidFromRef(stories[0].get('RevisionHistory')), {
                                //             success: function(record) {
                                //                 record.getCollection('Revisions').load({
                                //                     fetch: ['Description'],
                                //                     scope: this,
                                //                     callback: function(revisions) {
                                //                         console.log(revisions);
                                //                     }
                                //                 });
                                //             }
                                //         });
                                //     }
                                // });
                            pEst = this._loadRevHistoryModel(model, rec);
                            recStr = recStr + ' (' + pEst + 'pts)';
                            recStr = recStr + ' (77pts)';
                            // console.log("OLD WAY");
                            // console.log(rec.data.RevisionHistory);
                            // rec.data.RevisionHistory.getCollection('Revisions').load({
                            //     fetch: ['Description'],
                            //     callback: function(revisions) {
                            //         console.log(revisions);
                            //     }
                            // });
                            // console.log("REV HIST");
                            // console.log(rec.data.RevisionHistory);
                            // console.log(rec.data.RevisionHistory.Revisions);
                            // Ext.Array.each(rec.data.RevisionHistory.Revisions, function(rev) {
                            //     console.log("REV");
                            //     console.log(rev.RevisionNumber);
                            // });

                        }
                    }

                    if (state == 'Accepted' || state == 'Completed') {
                        htmlStr = htmlStr + '<font color="green">' + recStr + '</font><BR>';
                    } else if (state == 'Incomplete') {
                        htmlStr = htmlStr + '<font color="red">' + recStr + '</font><BR>';
                    } else {
                        htmlStr = htmlStr + recStr + '<BR>';
                    }
                    console.log("SET TEXT: " + htmlStr);
                    this._setText(htmlStr);
                },
                scope: this
            });

            // pEst = rec.get('PlanEstimate');
            // state = rec.get('ScheduleState');

            // recStr = rec.get('FormattedID') + ': ' + rec.get('Name');

            // if (pEst && pEst > 0) {
            //     recStr = recStr + ' (' + pEst + 'pts)';
            // } else {
            //     if (state && state == 'Incomplete') {
            //         // Use revision history to get old status

            //             // revModel = Rally.data.ModelFactory.getModel({
            //             //     type: 'RevisionHistory',
            //             //     success: function(model) {
            //             //         model.load(Rally.util.Ref.getOidFromRef(stories[0].get('RevisionHistory')), {
            //             //             success: function(record) {
            //             //                 record.getCollection('Revisions').load({
            //             //                     fetch: ['Description'],
            //             //                     scope: this,
            //             //                     callback: function(revisions) {
            //             //                         console.log(revisions);
            //             //                     }
            //             //                 });
            //             //             }
            //             //         });
            //             //     }
            //             // });
            //         revHisModel = Rally.data.ModelFactory.getModel({
            //             type: 'RevisionHistory',
            //             success: function(model) {
            //                 pEst = this._loadRevHistoryModel(model, rec);
            //                 recStr = recStr + ' (' + pEst + 'pts)';
            //                 console.log(recStr);
            //             },
            //             scope: this
            //         });
            //         recStr = recStr + ' (77pts)';
            //         // console.log("OLD WAY");
            //         // console.log(rec.data.RevisionHistory);
            //         // rec.data.RevisionHistory.getCollection('Revisions').load({
            //         //     fetch: ['Description'],
            //         //     callback: function(revisions) {
            //         //         console.log(revisions);
            //         //     }
            //         // });
            //         // console.log("REV HIST");
            //         // console.log(rec.data.RevisionHistory);
            //         // console.log(rec.data.RevisionHistory.Revisions);
            //         // Ext.Array.each(rec.data.RevisionHistory.Revisions, function(rev) {
            //         //     console.log("REV");
            //         //     console.log(rev.RevisionNumber);
            //         // });

            //     }
            // }

            // if (state == 'Accepted' || state == 'Completed') {
            //     htmlStr = htmlStr + '<font color="green">' + recStr + '</font><BR>';
            // } else if (state == 'Incomplete') {
            //     htmlStr = htmlStr + '<font color="red">' + recStr + '</font><BR>';
            // } else {
            //     htmlStr = htmlStr + recStr + '<BR>';
            // }
        }, this);
        console.log('RETURNING STRING');
        //return htmlStr;
    }
});
