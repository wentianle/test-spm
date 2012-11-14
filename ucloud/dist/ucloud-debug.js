define("#ucloud/1.0.0/ucloud-debug", ["es5-safe-debug", "json-debug", "#jquery/1.8.2/jquery-debug", "#underscore/1.4.2/underscore-debug", "#backbone/0.9.2/backbone-debug", "$-debug", "base64-debug", "console/umodel/1.0.0/umodel-debug", "plugins-debug", "util-debug", "sidebar-debug", "menus-debug", "uhost_list-debug", "udisk_list-debug", "udb_list-debug", "backup_list-debug", "param_list-debug", "snapshot_list-debug", "uimage_list-debug", "ufirewall_list-debug", "probe_list-debug", "monitor_group-debug", "palarm_list-debug", "ucdn_list-debug", "ucdn_bandwidth-debug", "ucdn_flow-debug", "ucdn_log-debug", "ucdn_loganalysis-debug", "domain-debug", "popup-debug", "record-debug", "domain.setting-debug", "domain.statistics-debug", "dns_login-debug", "rule_list-debug", "action_list-debug", "cache-debug"], function(require, exports, module) {
    require('es5-safe-debug');
    require('json-debug');

    var $ = require('#jquery/1.8.2/jquery-debug');
    var _ = require('#underscore/1.4.2/underscore-debug');
    var Backbone = require('#backbone/0.9.2/backbone-debug');
    var Base64 = require('base64-debug');
    var UModel = require('console/umodel/1.0.0/umodel-debug');

    require('plugins-debug')($);

    var Util = require('util-debug');
    var Sidebar = require('sidebar-debug');

    // 加载业务模块
    var Menus = require('menus-debug');
    var UhostList = require('uhost_list-debug');
    var UDiskList = require('udisk_list-debug');
    var UDbList = require('udb_list-debug');
    var BackupList = require('backup_list-debug');
    var ParamList = require('param_list-debug');
    var SnapshotList = require('snapshot_list-debug');
    var UimageList = require('uimage_list-debug');
    var UfirewallList = require('ufirewall_list-debug');
    var ProbeList = require('probe_list-debug');
    var MonitorGroup = require('monitor_group-debug');
    var PalarmList = require('palarm_list-debug');
    var UcdnList = require('ucdn_list-debug');
    var UcdnBandwidth = require('ucdn_bandwidth-debug');
    var UcdnFlow = require('ucdn_flow-debug');
    var UcdnLog = require('ucdn_log-debug');
    var UcdnLoganalysis = require('ucdn_loganalysis-debug');

    //dns 相关模块
    var Domain = require('domain-debug');
    var Popup = require('popup-debug');
    var Record = require('record-debug');
    var Setting = require('domain.setting-debug');
    var Statistics = require('domain.statistics-debug');
    var DnsLogin = require('dns_login-debug');

    var RuleList = require('rule_list-debug');
    var ActionList = require('action_list-debug');



    //Global Event Emmitter
    window.Events = _.extend({}, Backbone.Events);
    //Global Cache
    window.Cache = require('cache-debug');

    function checkPermission(position, bitmaps) {
        var p = 0,
            y = 0;
        p = Math.floor(position / 8);
        y = position % 8;

        if (bitmaps[p]) {
            return (1 << (7 - y)) & bitmaps[p];
        }
        return false;
    }

    var Router = Backbone.Router.extend({
        initialize: function() {
            var bitmaps = _.map(Base64.decode(UCLOUD.user.bitmaps).split(''), function(c) {
                return c.charCodeAt(0);
            });

            var menus = _.filter(Menus.menus, function(obj, key) {
                if (UCLOUD.user) {
                    if (checkPermission(obj.permission, bitmaps)) {
                        return {
                            label: obj.label,
                            link: obj.link,
                            key: obj.key
                        }
                    }
                }
            });

            this.GlobalMenus = new Sidebar.Views.GlobalMenus({
                menus: menus
            });

            this.GlobalMenus.render();
            this.GlobalMenus.router = this;
            Util.initGlobalLayout();
            window.Events.bind('navigate', this.navigate, this);
        },
        routes: {
            '': 'uhost',
            'uhost/:action': 'uhost',
            'udisk/:action': 'udisk',
            'udb/:action': 'udb',
            'ucdn/:action': 'ucdn',
            'udns/:action': 'udns',
            'udns/record/:domain': 'record'
        },
        ucloud: function() {
            this.navigate('uhost/uhost', true);
        },
        uhost: function(action) {
            window.Events.off();
            if (!action) action = 'uhost';

            var inner_main = $("#inner-main").html('');
            var inner_north = $("#inner-north").html('');

            Util.initInnerLayout();
            var sidebarel = $('#west-center > .ui-layout-content').html('');
            this.Sidebar = new Sidebar.Views.Sidebar({
                menus: Menus.menus.uhost.items,
                product: Menus.menus.uhost.key
            });

            this.Sidebar.router = this;
            sidebarel.append(this.Sidebar.render().el);
            this.Sidebar.current(action);
            this.GlobalMenus.current(Menus.menus.uhost.key);


            switch (action) {
            case 'uhost':
                Util.closeDesc();
                Util.openActions();
                this.collection = new UModel.Collections.Uhost();
                this.ActionView = new UhostList.Views.UhostActions({
                    collection: this.collection
                });
                this.ActionView.router = this;
                inner_north.append(this.ActionView.render().el);

                this.ListView = new UhostList.Views.UhostList({
                    collection: this.collection
                });
                inner_main.append(this.ListView.render().el);
                break;

            case 'uimage':
                Util.closeDesc();
                Util.openActions();
                this.collection = new UModel.Collections.Image();
                this.ActionView = new UimageList.Views.UimageActions({
                    collection: this.collection
                });
                inner_north.append(this.ActionView.render().el);

                this.ListView = new UimageList.Views.UimageList({
                    collection: this.collection
                });
                inner_main.append(this.ListView.render().el);
                break;

            case 'ufirewall':
                Util.closeDesc();
                Util.openActions();
                this.collection = new UModel.Collections.Ufirewall();
                this.ActionView = new UfirewallList.Views.UfirewallActions({
                    collection: this.collection
                });
                inner_north.append(this.ActionView.render().el);

                this.ListView = new UfirewallList.Views.UfirewallList({
                    collection: this.collection
                });
                inner_main.append(this.ListView.render().el);
                break;

            case 'probe':
                Util.closeDesc();
                Util.openActions();
                this.collection = new UModel.Collections.Probe();
                this.ActionView = new ProbeList.Views.ProbeActions({
                    collection: this.collection
                });
                inner_north.append(this.ActionView.render().el);

                this.ListView = new ProbeList.Views.ProbeList({
                    collection: this.collection
                });
                inner_main.append(this.ListView.render().el);
                break;

            case 'umonitor':
                Util.closeDesc();
                Util.openActions();
                Util.closeActions();
                this.collection = new UModel.Collections.Probe();
                this.indicators = new UModel.Collections.Indicator();

                this.currentData = new UModel.Collections.MonitorCurrentData();

                this.ActionView = new MonitorGroup.Views.MonitorActions({
                    indicators: this.indicators,
                    collection: this.currentData
                });

                inner_main.append(this.ActionView.render().el);

                this.MonitorDataList = new MonitorGroup.Views.MonitorDataList({
                    indicators: this.indicators,
                    currentData: this.currentData
                });
                inner_main.append(this.MonitorDataList.render().el);
                break;

            case 'palarm':
                Util.closeDesc();
                Util.openActions();
                this.collection = new UModel.Collections.Palarm();
                this.ActionView = new PalarmList.Views.PalarmActions({
                    collection: this.collection
                });
                inner_north.append(this.ActionView.render().el);

                this.ListView = new PalarmList.Views.PalarmList({
                    collection: this.collection
                });
                inner_main.append(this.ListView.render().el);
                break;
            case 'rule':
                Util.closeDesc();
                Util.closeActions();

                this.rule_collection = new UModel.Collections.SchedulerRule();
                this.RuleActionView = new RuleList.Views.RuleActions({
                    collection: this.rule_collection
                });
                inner_main.append(this.RuleActionView.render().el);

                this.RuleListView = new RuleList.Views.RuleList({
                    collection: this.rule_collection
                });
                inner_main.append(this.RuleListView.render().el);

                this.scheduler_action_collection = new UModel.Collections.SchedulerAction();
                this.SchedulerActionView = new ActionList.Views.SchedulerActionActions({
                    collection: this.scheduler_action_collection
                });
                inner_main.append(this.SchedulerActionView.render().el);

                this.SchedulerActionListView = new ActionList.Views.SchedulerActionList({
                    collection: this.scheduler_action_collection
                });
                inner_main.append(this.SchedulerActionListView.render().el);
                break;
            }
        },
        udisk: function(action) {
            window.Events.off();
            if (!action) action = 'udisk';

            var inner_main = $("#inner-main").html('');
            var inner_north = $("#inner-north").html('');

            Util.initInnerLayout();
            var sidebarel = $('#west-center > .ui-layout-content').html('');
            this.Sidebar = new Sidebar.Views.Sidebar({
                menus: Menus.menus.udisk.items,
                product: Menus.menus.udisk.key
            });

            this.Sidebar.router = this;
            sidebarel.append(this.Sidebar.render().el);
            this.GlobalMenus.current(Menus.menus.udisk.key);
            this.Sidebar.current(action);

            Util.closeDesc();
            Util.openActions();

            switch (action) {
            case 'udisk':
                this.collection = new UModel.Collections.Udisk();
                this.ActionView = new UDiskList.Views.UdiskActions({
                    collection: this.collection
                });
                this.ActionView.router = this;
                inner_north.append(this.ActionView.render().el);

                this.ListView = new UDiskList.Views.UdiskList({
                    collection: this.collection
                });
                this.ListView.router = this;
                inner_main.append(this.ListView.render().el); 
                break;

            case 'snapshot':
                this.collection = new UModel.Collections.Snapshot();
                this.ActionView = new SnapshotList.Views.SnapshotActions({
                    collection: this.collection
                });
                this.ActionView.router = this;
                inner_north.append(this.ActionView.render().el);

                this.ListView = new SnapshotList.Views.SnapshotList({
                    collection: this.collection
                });
                this.ListView.router = this;
                inner_main.append(this.ListView.render().el);
                break;

            }
        },
        udb: function(action) {
            window.Events.off();
            if (!action) action = 'instance';

            var inner_main = $("#inner-main").html('');
            var inner_north = $("#inner-north").html('');

            Util.initInnerLayout();
            var sidebarel = $('#west-center > .ui-layout-content').html('');
            this.Sidebar = new Sidebar.Views.Sidebar({
                menus: Menus.menus.udb.items,
                product: Menus.menus.udb.key
            });

            this.Sidebar.router = this;
            sidebarel.append(this.Sidebar.render().el);
            this.GlobalMenus.current(Menus.menus.udb.key);

            this.Sidebar.current(action);

            Util.closeDesc();
            Util.openActions();

            switch (action) {
            case 'instance':

                this.collection = new UModel.Collections.Udb();
                this.ActionView = new UDbList.Views.UdbActions({
                    collection: this.collection
                });
                this.ActionView.router = this;
                inner_north.append(this.ActionView.render().el);

                this.ListView = new UDbList.Views.UdbList({
                    collection: this.collection
                });
                this.ListView.router = this;
                inner_main.append(this.ListView.render().el);
                break;

            case 'backup':
                this.collection = new UModel.Collections.Backup();
                this.ActionView = new BackupList.Views.BackupActions({
                    collection: this.collection
                });
                this.ActionView.router = this;
                inner_north.append(this.ActionView.render().el);

                this.ListView = new BackupList.Views.BackupList({
                    collection: this.collection
                });
                this.ListView.router = this;
                inner_main.append(this.ListView.render().el);
                break;

            case 'param':

                this.collection = new UModel.Collections.Param();
                this.ActionView = new ParamList.Views.ParamActions({
                    collection: this.collection
                });
                this.ActionView.router = this;
                inner_north.append(this.ActionView.render().el);

                this.ListView = new ParamList.Views.ParamList({
                    collection: this.collection
                });
                this.ListView.router = this;
                inner_main.append(this.ListView.render().el);
                break;

            }
        },
        ucdn: function(action) {
            window.Events.off();
            if (!action) action = 'ucdn';

            var inner_main = $("#inner-main").html('');
            var inner_north = $("#inner-north").html('');

            Util.initInnerLayout();
            var sidebarel = $('#west-center > .ui-layout-content').html('');
            this.Sidebar = new Sidebar.Views.Sidebar({
                menus: Menus.menus.ucdn.items,
                product: Menus.menus.ucdn.key
            });

            this.Sidebar.router = this;
            sidebarel.append(this.Sidebar.render().el);
            this.GlobalMenus.current(Menus.menus.ucdn.key);
            this.Sidebar.current(action);

            Util.closeDesc();
            Util.openActions();

            switch (action) {
            case 'ucdn':
                this.collection = new UModel.Collections.Ucdn();
                this.ActionView = new UcdnList.Views.UcdnActions({
                    collection: this.collection
                });
                this.ActionView.router = this;
                inner_north.append(this.ActionView.render().el);

                this.ListView = new UcdnList.Views.UcdnList({
                    collection: this.collection
                });
                this.ListView.router = this;
                inner_main.append(this.ListView.render().el);
                break;
            case 'bandwidth':
                Util.closeActions();
                this.collection = new UModel.Collections.Ucdn();

                //加入 dom 树由 view 自己处理 通过传入 parent 方式
                this.ActionView = new UcdnBandwidth.Views.BandWandwidthActions({
                    collection: this.collection,
                    parent: inner_main
                });
                this.ActionView.render();
                break;
            case 'flow':
                Util.closeActions();
                this.collection = new UModel.Collections.Ucdn();

                //加入 dom 树由 view 自己处理 通过传入 parent 方式
                this.ActionView = new UcdnFlow.Views.UcdnFlowActions({
                    collection: this.collection,
                    parent: inner_main
                });
                this.ActionView.render();
                break;
            case 'logfile':
                this.cdn_domain = new UModel.Collections.Ucdn();
                this.collection = new UModel.Collections.UcdnLog();
                this.ActionView = new UcdnLog.Views.UcdnLogActions({
                    cdn_domain: this.cdn_domain,
                    collection: this.collection
                });

                inner_north.append(this.ActionView.render().el);
                this.ListView = new UcdnLog.Views.UcdnLogList({
                    collection: this.collection
                });
                inner_main.append(this.ListView.render().el);
                break;
             case 'loganalysis':
                this.cdn_domain = new UModel.Collections.UcdnLogAnalysisDomain();
                this.collection = new UModel.Collections.UcdnLogAnalysis();
                this.ActionView = new UcdnLoganalysis.Views.UcdnLogAnalysisActions({
                    cdn_domain: this.cdn_domain,
                    collection: this.collection
                }); 
                inner_north.append(this.ActionView.render().el);
                this.ListView = new UcdnLoganalysis.Views.UcdnLogAnalysisList({
                    collection: this.collection
                }); 
                inner_main.append(this.ListView.render().el);
                break;
            }   
        },
        udns: function(action, domain) {
            var sidebarel = $('#west-center > .ui-layout-content').html('');
            this.Sidebar = new Sidebar.Views.Sidebar({
                menus: Menus.menus.udns.items,
                product: Menus.menus.udns.key
            });

            this.Sidebar.router = this;
            sidebarel.append(this.Sidebar.render().el);
            this.GlobalMenus.current(Menus.menus.udns.key);
            this.Sidebar.current(action);

            var inner_main = $("#inner-main").html('');
            Util.initInnerLayout();
            Util.closeDesc();
            Util.closeActions();

            switch (action) {
            case 'login':
                if (window.UCLOUD.user.dnspod_email && window.UCLOUD.user.dnspod_passwd) {
                    this.navigate('/udns/domain', true);
                    return;
                }

                $.ajax({
                    url: '/udns/domain/getBindInfo',
                    type: 'GET',
                    cache: false,
                    async: false,
                    dataType: 'json',
                    success: function(response) {
                        if (response.ret_code == 0) {
                            if (response.data.dnspod_email && response.data.dnspod_passwd) {
                                window.UCLOUD.user = response.data;
                                window.router.navigate('/udns/domain', true);
                            } else {
                                var view = new DnsLogin.Views.DnsLogin();
                                inner_main.append(view.render().el);
                            }
                        }
                    }
                });


                break;
            case 'domain':
                if (!window.UCLOUD.user.dnspod_email || !window.UCLOUD.user.dnspod_passwd) {
                    this.navigate('/udns/login', true);
                    return;
                }

                inner_main.append($("<div class='dns'></div>"));
                this.collection = new Domain.Collections.DomainList;
                var actionsViewOption = {
                    collection: this.collection
                };
                this.actionsView = this.actionsViewOption || new Domain.Views.DomainActions(actionsViewOption);
                this.actionsView.router = this;
                inner_main.find('.dns').append(this.actionsView.render().el);

                this.listView = new Domain.Views.DomainList({
                    collection: this.collection
                });
                this.listView.router = this;
                inner_main.find('.dns').append(this.listView.render().el);
                break;

            }
        },
        record: function(domain, page) {
            var sidebarel = $('#west-center > .ui-layout-content').html('');
            this.Sidebar = new Sidebar.Views.Sidebar({
                menus: Menus.menus.udns.items,
                product: Menus.menus.udns.key
            });

            this.Sidebar.router = this;
            sidebarel.append(this.Sidebar.render().el);
            this.GlobalMenus.current(Menus.menus.udns.key);
            this.Sidebar.current('domain');

            var inner_main = $("#inner-main").html('');
            Util.initInnerLayout();
            Util.closeDesc();
            Util.closeActions();

            if (!window.UCLOUD.user.dnspod_email || !window.UCLOUD.user.dnspod_passwd) {
                this.navigate('/udns/login', true);
                return;
            }
            inner_main.append($("<div id='main' class='dns'></div>"));
            var $main = $('#main').html('');

            var that = this;

            //需要严格检查domain的有效性
            if (/。/.test(domain)) {
                this.navigate("/udns/record/" + domain.replace('。', '.'), true);
                return false;
            }

            //首次进入记录的情况下需要得到记录对应域名的状态
            //这需要首先载入这个域名的model
            //需要严格检查domain的有效性
            var domain_id;

            if (!(this.current_domain && this.current_domain.get('id') && domain == this.current_domain.get('name'))) {

                //同步获取到域名的Id,simple
                var need_navigate = null;
                $.ajax({
                    url: '/udns/api_proxy/post',
                    data: {
                        api_name: '/Api/Domain.Info',
                        domain: domain
                    },
                    type: 'POST',
                    async: false,
                    dataType: 'json',
                    success: function(data) {
                        if (data.status.code == 1) {
                            that.current_domain = new Domain.Models.Domain(data.domain);
                        } else if (data.alias) {
                            need_navigate = data.alias.name;
                        } else {
                            need_navigate = '/';
                        }
                    }
                });
            }

            if (need_navigate) {
                that.navigate(need_navigate, true);
                return false;
            }

            if (!that.current_domain) {
                that.navigate('/', true);
                return false;
            }

            domain_id = that.current_domain.get('id');

            var $main = $('#main').html('');

            this.record_collection = new Record.Collections.RecordList([], {
                domain: domain_id,
                domain_model: this.current_domain
            });

            $main.append($("<div class='RecordHeader'></div>"));
            var headerView = new Record.Views.DomainHeader({
                tab: 'records',
                domain_title: domain,
                current_domain: this.current_domain,
                collection: this.record_collection
            });

            $main.find('.RecordHeader').append($(headerView.render().el));


            var actionsView = new Record.Views.RecordActions({
                domain: domain_id,
                domain_title: domain,
                current_domain: this.current_domain,
                collection: this.record_collection
            });

            $main.find('.RecordHeader').append($(actionsView.render().el));

            var listView = new Record.Views.RecordList({
                domain: domain_id,
                collection: this.record_collection
            });

            $main.append("<div id='main-content'></div>");
            $main.find('#main-content').append($(listView.render().el));
            this.record_collection.getRecordList(page || 0);


        }
    });
    window.router = new Router();
    Backbone.history.start();
    $('.dropdown-toggle').dropdown();
    $('[rel=popover]').popover();

    $('[rel=twipsy]').tooltip({
        placement: 'top'
    });
    $('body').delegate('[rel=twipsy]', 'mouseenter', function() {
        $('[rel=twipsy]').tooltip();
    });

    $("[rel=popover]").popover({
        offset: 10,
        html: true,
        live: true
    });

    $("body").delegate("#help_btn", 'click', function() {
        var $this = $(this);
        $("div.help_" + $this.attr("site")).toggle('slow');
    });
});
