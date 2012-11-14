define("#umodel/1.0.0/umodel-debug", ["#jquery/1.8.2/jquery-debug", "#underscore/1.4.2/underscore-debug", "#backbone/0.9.2/backbone-debug", "$-debug"], function(require, exports, module) {
    var $ = require('#jquery/1.8.2/jquery-debug');
    var _ = require('#underscore/1.4.2/underscore-debug');
    var Backbone = require('#backbone/0.9.2/backbone-debug');

    Backbone.sync = function() {};

    //console model 定义
    exports.Models = exports.Models || {};

    //设置加载状态
    $("#mskLoader").ajaxSend(function(evt, request, settings) {
        if (settings.type == 'GET') {
            $(this).show();
        }
    });

    $("#mskLoader").ajaxComplete(function() {
        $(this).hide();
    });

    $("body").ajaxSuccess(function(evt, request, settings) {
        request.done(function(response) {
            if (response.ret_code == 11040) {
                window.location.href = '/account/cas/login';
            }
        });
    });

    /*主机*/
    exports.Models.Uhost = Backbone.Model.extend({
        defaluts: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.charge_type) {
            case 1:
                data.charge_type_lable = "按小时";
                break;
            case 2:
                data.charge_type_lable = "按月";
                break;
            case 3:
                data.charge_type_lable = "按年";
                break;
            }

            if (data.vm_disk) {
                _.each(data.vm_disk, function(obj) {
                    if (obj.mount_device.indexOf('dev') === -1) {
                        obj.mount_device = '/dev/' + obj.mount_device;
                    }
                    if (obj.bs_id) {
                        data.net_disk = data.net_disk || [];
                        data.net_disk.push(obj);
                    } else {
                        data.local_disk = data.local_disk || [];
                        data.local_disk.push(obj);
                    }

                });
            }
            if (data.public_ip_info) {
                _.each(data.public_ip_info, function(obj) {
                    if (obj.operator_id == 10001) {
                        data.public_ip_ctc = obj.ip_addr;
                    } else if (obj.operator_id == 10002) {
                        data.public_ip_cnc = obj.ip_addr;
                    }
                });
            }

            if (_.include([500, 600, 650, 10, 20, 30, 40, 50], data.vm_state)) {
                data.loader_display = 'inline';
            } else {
                data.loader_display = 'none';
            }

            data.create_time = $.format.date(new Date(parseInt(data.create_time) * 1000), "yyyy-MM-dd HH:mm");
            if (data.charge_type == 1) {
                data.show_run_time = true;
            } else {
                data.show_run_time = false;
            }

            if (data.tag_info) {
                data.tag_id = data.tag_info[0].tag_id;
                data.tag_name = data.tag_info[0].tag_name;
            }
            if(data.vm_type){
                data.memory_unit = data.vm_type.memory_unit / 1024; 
            }

            data.get_purchase_value = function(){
                if(data.charge_type != 1){
                    var dev = 24 * 60 * 60 * 1000;
                    var _tem_time = data.purchase_value * 1000 - Date.parse(new Date());
                    return Math.floor(_tem_time / dev)+"天";
                }
                return "";
            }
            return data;
        }
    });

    /*DB*/
    exports.Models.Udb = Backbone.Model.extend({
        defaluts: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.state) {
            case 10:
                data.state_lable = "初始化";
                data.state_key = "600";
                break;
            case 20:
                data.state_lable = "安装失败";
                data.state_key = "610";
                break;
            case 30:
                data.state_lable = "启动中";
                data.state_key = "500";
                break;
            case 40:
                data.state_lable = "运行中";
                data.state_key = "510";
                data.change_group = 1;
                break;
            case 50:
                data.state_lable = "关闭中";
                data.state_key = "600";
                break;
            case 60:
                data.state_lable = "关闭";
                data.state_key = "610";
                data.change_group = 1;
                break;
            }
            if (_.include([10, 30, 50], data.state)) {
                data.loader_display = 'inline';
            } else {
                data.loader_display = 'none';
            }

            if (data.src_id == data.db_id || !data.src_id) {
                data.src_lable = "Master";
            } else {
                data.src_lable = "Slave";
            }
            if (data.disk_space_usage) {
                data.used_size = parseInt(data.disk_space_usage.used_size / 1024);
                data.data_size = parseInt(data.disk_space_usage.data_file_size / 1024);
                data.system_size = parseInt(data.disk_space_usage.system_file_size / 1024);
                data.usable_size = parseInt(data.disk_space_usage.total_space / 1024) - data.used_size;
            }
            switch (data.charge_type) {
                case 0:
                    data.charge_lable = "N/A";
                    break;
                case 1:
                    data.charge_lable = "按小时";
                    break;
                case 2:
                    data.charge_lable = "按月";
                    break;
                case 3:
                    data.charge_lable = "按年";
                    break;
            }
            if (data.expire_time == 0) {
                data.expire_time = "N/A";
            } else {
                data.expire_time = $.format.date(new Date(parseInt(data.expire_time) * 1000), "yy-MM-dd HH:mm");
            }
            data.show_expire_time = function(){
                if(data.charge_type != 0 && data.charge_type != 1){
                    return true 
                } 
                return false;
            }
            data.create_time = $.format.date(new Date(parseInt(data.create_time) * 1000), "yy-MM-dd HH:mm");
            return data;
        },
        syncStatus: function() {
            var that = this;
            $.ajax({
                url: "/api/udb/state",
                data: {
                    db_id: that.get('db_id'),
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                global: false,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.set(response.data)
                        that.trigger('change');
                    }
                },
                error: function(e) {}
            });
        },
        syncDesc: function() {
            var that = this;
            $.ajax({
                url: "/api/udb/instances",
                data: {
                    db_id: that.get('db_id'),
                    need_space_usage: 1,
                    db_kind: 1,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: false,
                success: function(response) {
                    if (response.ret_code == 0) {
                        if (that.get('src_id') != that.get('db_id')) {
                            $.ajax({
                                url: "/api/udb/instances",
                                data: {
                                    db_id: that.get('src_id'),
                                    need_space_usage: 0,
                                    db_kind: 1,
                                    use_session: 'yes',
                                    format: 'json'
                                },
                                type: 'GET',
                                cache: false,
                                dataType: 'json',
                                async: true,
                                success: function(response) {
                                    if (response.ret_code == 0) {
                                        that.set('master_db_info', response.data);
                                    }
                                },
                                error: function(e) {}
                            });
                        }
                        that.set(response.data[0]);
                        that.trigger('change');
                    }
                },
                error: function(e) {}
            });
        }
    });

    exports.Models.DbInstance = Backbone.Model.extend({
        defaluts: {
            selected: false
        }
    });

    /*运营商*/
    exports.Models.Isp = Backbone.Model.extend({});

    /* 防火墙 */
    exports.Models.Ufirewall = Backbone.Model.extend({
        defaults: {
            disable: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            data.create_time = $.format.date(new Date(parseInt(data.create_time) * 1000), "yyyy-MM-dd HH:mm");
            return data;
        }
    });

    /* 机型 */
    exports.Models.VmType = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            data.cpu_unit = parseInt(data.cpu_unit) / 10;
            data.memory_unit = parseInt(data.memory_unit) / 1024;
            return data;
        }
    });

    /* 镜像 */
    exports.Models.Image = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            data.loader_display = "none";
            if (data.state == 1) {
                data.loader_display = "inline";
            }
            return data;
        },
        syncStatus: function() {
            var that = this;
            var data = this.toJSON();
            $.ajax({
                url: "/api/uimage",
                data: {
                    image_id: that.get('image_id'),
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                global: false,
                success: function(response) {
                    if (response.ret_code == 0) {
                        data.desc = response.data;
                        that.set(data);
                        that.trigger('change');
                    }
                },
                error: function(e) {}
            });
        }
    });

    /* udisk */
    exports.Models.Udisk = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            if (data.use_in_vm_device) {
                if (data.use_in_vm_device.indexOf('dev') == -1) {
                    data.use_in_vm_device = '/dev/' + data.use_in_vm_device;
                }
            }
            if (_.include([1, 3], data.status)) {
                data.loader_display = 'inline';
            } else {
                data.loader_display = 'none';
            }
            data.update_time = $.format.date(new Date(parseInt(data.update_time) * 1000), "yyyy-MM-dd HH:mm");
            return data;
        },
        syncStatus: function() {
            var that = this;
            $.ajax({
                url: "/api/udisk",
                data: {
                    bs_id: that.get('bs_id'),
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                global: false,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.set(response.data)
                    }
                },
                error: function(e) {}
            });
        }
    });

    /* DB版本 */
    exports.Models.DbType = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    /* Cluster */
    exports.Models.ClusterType = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    /* Factory */
    exports.Models.FactoryType = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    /* DB类型 */
    exports.Models.InstanceType = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    /* DB配置文件 */
    exports.Models.ParamGroup = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    /* DB备份策略 */
    exports.Models.BackupType = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    /* DB备份 */
    exports.Models.Backup = Backbone.Model.extend({
        defaults: {
            selected: false,
            visual: true
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.backup_type) {
            case 0:
                data.backup_type = "自动";
                break;
            case 1:
                data.backup_type = "手动";
                break;
            }
            switch (data.state) {
            case 0:
                data.state_lable = "备份中";
                data.state_key = "500";
                break;
            case 1:
                data.state_lable = "备份成功";
                data.state_key = "510";
                break;
            case 2:
                data.state_lable = "备份失败";
                data.state_key = "600";
                break;
            }
            data.backup_size = Math.ceil(data.backup_size / (1024 * 1024));
            data.backup_time = $.format.date(new Date(parseInt(data.backup_time) * 1000), "yy-MM-dd HH:mm");
            return data;
        }
    });

    /* DB配置 */
    exports.Models.Param = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        syncStatus: function() {
            var that = this;
            var data = this.toJSON();
            $.ajax({
                url: "/api/udb/paramdesc",
                data: {
                    group_id: that.get('id'),
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                global: false,
                success: function(response) {
                    if (response.ret_code == 0) {
                        data.desc = response.data;
                        that.set(data);
                    }
                },
                error: function(e) {}
            });
        }
    });

    exports.Models.Snapshot = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            data.create_time = $.format.date(new Date(parseInt(data.create_time) * 1000), "yyyy-MM-dd HH:mm");
            return data;
        }
    });

    exports.Models.NetInfo = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    exports.Models.UfirewallRule = Backbone.Model.extend({
        defaults: {
            action: 'ACCEPT'
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.proto_type) {
            case 1:
                data.proto_type_desc = "TCP";
                break;
            case 2:
                data.proto_type_desc = "UDP";
                break;
            case 3:
                data.proto_type_desc = "ICMP";
                break;
            }
            return data;
        }
    });

    exports.Models.Probe = Backbone.Model.extend({
        defaults: {
            action: 'ACCEPT'
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.probe_type) {
            case 1:
                data.probe_type = "PING";
                break;
            case 2:
                data.probe_type = "TCP";
                break;
            case 3:
                data.probe_type = "UDP";
                break;
            }
            return data;
        }
    });

    exports.Models.AlarmTarget = Backbone.Model.extend({});

    exports.Models.Indicator = Backbone.Model.extend({});

    exports.Models.Tag = Backbone.Model.extend({});

    exports.Models.MonitorCurrentData = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    exports.Models.Palarm = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.alarm_type) {
            case 10:
                data.alarm_type = "严重";
                break;
            case 20:
                data.alarm_type = "告警";
                break;
            case 30:
                data.alarm_type = "通知";
                break;
            }
            return data;
        }
    });

    exports.Models.Ucdn = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.status) {
            case 0:
                data.status_lable = "审核中";
                break;
            case 1:
                data.status_lable = "审核通过";
                break;
            case 2:
                data.status_lable = "审核未过";
                break;
            case 3:
                data.status_lable = "加速中";
                break;
            }
            data.create_time = $.format.date(new Date(parseInt(data.create_time) * 1000), "yyyy-MM-dd HH:mm");
            return data;
        }
    });

    exports.Models.UcdnTraffic = Backbone.Model.extend({
        getTraffic: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/ucdn/traffic',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                async: noasync ? false : true,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.set(response.data);
                    }
                },
                error: function(e) {}
            });
        },
        priceCount: function(traffic) {
            var total_price;
            $.ajax({
                url: '/api/ucdn/price_count',
                data: {
                    traffic: traffic,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        total_price = response.data;
                    }
                }
            });

            return {
                total_price: total_price,
                price: (parseFloat(total_price) / parseFloat(traffic)).toFixed(2)
            };
        }
    });

    exports.Models.TraffcAlarm = Backbone.Model.extend({
        getAlarmConfigByCdnDomain: function(cdn_domain) {
            var that = this;
            $.ajax({
                url: '/api/ucdn/alarm',
                data: {
                    cdn_domain: cdn_domain,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.set(response.data);
                    }
                }
            });
        }
    });

    exports.Models.UcdnLog = Backbone.Model.extend({
        getTemplateJson: function() {
            var data = this.toJSON();
            data.title = data.log_name.slice(data.log_name.lastIndexOf('/') + 1);
            return data;
        }
    });


    exports.Models.UcdnLogAnalysisDomain = Backbone.Model.extend({
        getTemplateJson: function() {
            var data = this.toJSON();
            return data;
        }
    });


    exports.Models.UcdnLogAnalysis = Backbone.Model.extend({
        getTemplateJson: function() {
            var data = this.toJSON();
            return data;
        }
    });

    exports.Models.AccountTransaction = Backbone.Model.extend({
        getTemplateJson: function() {
            var data = this.toJSON();
            data.create_time = $.format.date(new Date(parseInt(data.create_time) * 1000), "yyyy-MM-dd HH:mm");
            switch (data.pay_platform) {
            case 10:
                data.pay_platform = '支付宝';
                break;

            default:
                data.pay_platform = '';
                break;
            }

            switch (data.transaction_type) {
            case 1:
                data.transaction_type = '扣款';
                break;

            case 2:
                data.transaction_type = '充值';
                break;
            }
            return data;
        }
    });

    exports.Models.AccountBill = Backbone.Model.extend({
        getTemplateJson: function() {
            var data = this.toJSON();
            if (!exports.vmtypes) {
                exports.vmtypes = new exports.Collections.VmType();
                exports.vmtypes.getList(0, true);
            }
            var vmtype = exports.vmtypes.where({
                id: data.vm_type
            });
            data.cost = (parseFloat(data.cost) / 100).toFixed(2);
            data.price = (parseFloat(data.price) / 100).toFixed(2);

            switch (data.charge_type) {
            case 1:
                data.price += '元/小时';
                data.charge_type = '小时';
                break;
            case 2:
                data.price += '元/月'
                data.charge_type = '月';
                break;
            case 3:
                data.price += '元/年'
                data.charge_type = '年';
                break;
            }

            if (vmtype.length) {
                data.vm_type_name = vmtype[0].get('name');
            }
            return data;
        }
    });

    exports.Models.SchedulerRule = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.obj_type) {
            case 2:
                data.obj_type_lable = '组';
                data.obj_name = this.getTagById(data.obj_id);
                break;
            case 1:
                data.obj_type_lable = '主机';
                data.obj_name = this.getVmById(data.obj_id);
                break;
            }
            return data;
        },
        getTagById: function(obj_id) {
            if (!exports.Tags) {
                exports.Tags = new exports.Collections.Tag();
                exports.Tags.getList(true);
            }
            var model = exports.Tags.where({
                tag_id: parseInt(obj_id)
            });
            if (model.length) {
                return model[0].get('tag_name');
            }
            return '无绑定对象';
        },
        getVmById: function(obj_id) {
            if (!exports.Uhost) {
                exports.Uhost = new exports.Collections.Uhost();
                exports.Uhost.getList(true);
            }
            var model = exports.Uhost.where({
                vmid: obj_id
            });
            if (model.length) {
                return model[0].get('hostname');
            }
            return '无绑定对象';
        }

    });

    exports.Models.SchedulerAction = Backbone.Model.extend({
        defaults: {
            selected: false
        },
        getTemplateJson: function() {
            var data = this.toJSON();
            return data;
        }
    });

    exports.Models.ConsoleLog = Backbone.Model.extend({
        getTemplateJson: function() {
            var data = this.toJSON();
            switch (data.action_type) {
            case 0:
                data.action_type = '其他操作';
                break;
            case 1:
                data.action_type = '分配主机';
                break;
            case 2:
                data.action_type = '关机';
                break;
            case 3:
                data.action_type = '开机';
                break;
            case 4:
                data.action_type = '列表';
                break;
            case 5:
                data.action_type = '删除';
                break;
            case 6:
                data.action_type = '重启';
                break;
            }
            data.action_time = $.format.date(new Date(parseInt(data.action_time) * 1000), "yyyy-MM-dd HH:mm");
            return data;
        }
    });

    //console 数据结合定义
    exports.Collections = exports.Collections || {};

    /*isp */
    exports.Collections.Isp = Backbone.Collection.extend({
        model: exports.Models.Isp
    });

    /*主机信息*/
    exports.Collections.Uhost = Backbone.Collection.extend({
        model: exports.Models.Uhost,
        getList: function(no_async) {
            var that = this;
            $.ajax({
                url: '/api/instances',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                async: no_async ? false : true,
                dataType: 'json'
            }).done(function(response) {
                if (response.ret_code == 0) {
                    that.reset(response.data);
                }
            });
        }
    });

    /*机型信息*/
    exports.Collections.VmType = Backbone.Collection.extend({
        model: exports.Models.VmType,
        getList: function(disk_space_unit, noasync) {
            var that = this;
            $.ajax({
                url: '/api/vmtypes',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        if (disk_space_unit) {
                            var data = _.filter(response.data, function(obj) {
                                if (parseInt(obj.disk_space_unit) >= parseInt(disk_space_unit)) {
                                    return true;
                                }
                            });
                            that.reset(data);
                        } else {
                            that.reset(response.data);
                        }
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    /*镜像*/
    exports.Collections.Image = Backbone.Collection.extend({
        model: exports.Models.Image,
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/uimages',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        var data = _.filter(response.data, function(obj) {
                            return obj.state == 0;
                        });
                        that.reset(data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        },
        getListByCustomType: function() {
            var that = this;
            $.ajax({
                url: '/api/uimages',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        var data = _.filter(response.data, function(obj) {
                            return obj.image_type == 2;
                        });
                        that.reset(data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        },
        getImageById: function(image_id) {
            var data;
            $.ajax({
                url: '/api/uimage',
                data: {
                    image_id: image_id,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        data = response.data;
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
            return data;
        },
        comparator: function(model) {
            return model.get("name");
        }
    });

    /*防火墙*/
    exports.Collections.Ufirewall = Backbone.Collection.extend({
        model: exports.Models.Ufirewall,
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/ufirewall',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        },
        comparator: function(model) {
            return model.get("name");
        }
    });

    /*DB信息*/
    exports.Collections.Udb = Backbone.Collection.extend({
        model: exports.Models.Udb,
        getList: function() {
            var that = this;
            var data = new Array();
            $.ajax({
                url: '/api/udb/instances',
                data: {
                    use_session: 'yes',
                    format: 'json',
                    db_kind: '2'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        data = response.data;
                        that.reset(data);
                        for (var i = 0; i < data.length; i++) {
                            data[i].src_id = data[i].db_id;
                            if (data[i].slave_db_info.length) {
                                data[i].slave_db_lable = 1;
                                for (var j = 0; j < data[i].slave_db_info.length; j++) {
                                    that.add(data[i].slave_db_info[j]);
                                }
                            }
                        }
                        $.ajax({
                            url: '/api/udb/instancetypes',
                            data: {
                                use_session: 'yes',
                                format: 'json'
                            },
                            type: 'GET',
                            cache: false,
                            async: false,
                            dataType: 'json',
                            success: function(response) {
                                if (response.ret_code == 0) {
                                    for (var i = 0; i < data.length; i++) {
                                        for (var j = 0; j < response.data.length; j++) {
                                            if (data[i].instance_type_id == response.data[j].id) {
                                                data[i].instance_type_name = response.data[j].name;
                                                data[i].diskspace = response.data[j].diskspace;
                                                data[i].memory = response.data[j].memory;
                                            }
                                            if (data[i].slave_db_info) {
                                                for (var m = 0; m < data[i].slave_db_info.length; m++) {
                                                    if (data[i].slave_db_info[m].instance_type_id == response.data[j].id) {
                                                        data[i].slave_db_info[m].instance_type_name = response.data[j].name;
                                                        data[i].slave_db_info[m].diskspace = response.data[j].diskspace;
                                                        data[i].slave_db_info[m].memory = response.data[j].memory;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    that.reset(data);
                                    for (var i = 0; i < data.length; i++) {
                                        if (data[i].slave_db_info) {
                                            for (var j = 0; j < data[i].slave_db_info.length; j++) {
                                                that.add(data[i].slave_db_info[j]);
                                            }
                                        }
                                    }
                                }
                            },
                            error: function(e) {}
                        });
                        $.ajax({
                            url: '/api/udb/clustertypes',
                            data: {
                                use_session: 'yes',
                                format: 'json'
                            },
                            type: 'GET',
                            cache: false,
                            dataType: 'json',
                            success: function(response) {
                                if (response.ret_code == 0) {
                                    var s = 0,
                                        i = 0;
                                    var db_type_list = new Array();
                                    var cluster_list = response.data;
                                    for (i = 0; i < cluster_list.length; i++) {
                                        $.ajax({
                                            url: '/api/udb/factorytypes',
                                            data: {
                                                cluster_id: cluster_list[i].id,
                                                use_session: 'yes',
                                                format: 'json'
                                            },
                                            type: 'GET',
                                            cache: false,
                                            dataType: 'json',
                                            success: function(factory_response) {
                                                if (factory_response.ret_code == 0) {
                                                    if (factory_response.data.length) {
                                                        for (var j = 0; j < factory_response.data.length; j++) {
                                                            for (var k = 0; k < cluster_list.length; k++) {
                                                                if (cluster_list[k].id == factory_response.data[j].cluster_id) {
                                                                    factory_response.data[j].cluster_name = cluster_list[k].name;
                                                                }
                                                            }
                                                            db_type_list[s] = factory_response.data[j];
                                                            s = s + 1;
                                                        }
                                                    }
                                                    if (i = cluster_list.length - 1) {
                                                        for (var m = 0; m < data.length; m++) {
                                                            for (var n = 0; n < db_type_list.length; n++) {
                                                                if (data[m].db_type_id == db_type_list[n].id) {
                                                                    data[m].db_type_name = db_type_list[n].name;
                                                                    data[m].db_type = db_type_list[n].cluster_name;
                                                                }
                                                                if (data[m].slave_db_info) {
                                                                    for (var t = 0; t < data[m].slave_db_info.length; t++) {
                                                                        if (data[m].slave_db_info[t].db_type_id == db_type_list[n].id) {
                                                                            data[m].slave_db_info[t].db_type_name = db_type_list[n].name;
                                                                            data[m].slave_db_info[t].db_type = db_type_list[n].cluster_name;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        that.reset(data);
                                                        for (var i = 0; i < data.length; i++) {
                                                            if (data[i].slave_db_info) {
                                                                for (var j = 0; j < data[i].slave_db_info.length; j++) {
                                                                    that.add(data[i].slave_db_info[j]);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            },
                                            error: function(e) {}
                                        });
                                    }
                                }
                            },
                            error: function(e) {}
                        });
                        $.ajax({
                            url: '/api/udb/param',
                            data: {
                                offset: 0,
                                max_count: 999,
                                use_session: 'yes',
                                format: 'json'
                            },
                            type: 'GET',
                            cache: false,
                            async: false,
                            dataType: 'json',
                            success: function(response) {
                                if (response.ret_code == 0) {
                                    for (var i = 0; i < data.length; i++) {
                                        for (var j = 0; j < response.data.length; j++) {
                                            if (data[i].param_group_id == response.data[j].id) {
                                                data[i].param_group_name = response.data[j].name;
                                            }
                                            for (var m = 0; m < data[i].slave_db_info.length; m++) {
                                                if (data[i].slave_db_info[m].param_group_id == response.data[j].id) {
                                                    data[i].slave_db_info[m].param_group_name = response.data[j].name;
                                                }
                                            }
                                        }
                                    }
                                    that.reset(data);
                                    for (var i = 0; i < data.length; i++) {
                                        if (data[i].slave_db_info.length) {
                                            data[i].slave_db_lable = 1;
                                            for (var j = 0; j < data[i].slave_db_info.length; j++) {
                                                that.add(data[i].slave_db_info[j]);
                                            }
                                        }
                                    }
                                }
                            },
                            error: function(e) {}
                        });
                    }
                },
                error: function(e) {}
            });
        },
        comparator: function(model) {
            return model.get("src_id");
        }
    });

    exports.Collections.DbInstance = Backbone.Collection.extend({
        model: exports.Models.DbInstance,
        getList: function() {
            var that = this;
            $.ajax({
                url: '/api/udb/instances',
                data: {
                    use_session: 'yes',
                    format: 'json',
                    db_kind: '2'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {}
            });
        }
    });

    /*DB版本*/
    exports.Collections.DbType = Backbone.Collection.extend({
        model: exports.Models.DbType,
        getList: function() {
            var that = this;
            $.ajax({
                url: '/api/udb/clustertypes',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        var s = 0,
                            i = 0;
                        var dbtype_list = response.data;
                        for (i = 0; i < dbtype_list.length; i++) {
                            $.ajax({
                                url: '/api/udb/factorytypes',
                                data: {
                                    cluster_id: dbtype_list[i].id,
                                    use_session: 'yes',
                                    format: 'json'
                                },
                                type: 'GET',
                                cache: false,
                                async: false,
                                dataType: 'json',
                                success: function(factory_response) {
                                    if (factory_response.ret_code == 0) {
                                        for (var j = 0; j < factory_response.data.length; j++) {
                                            for (var k = 0; k < dbtype_list.length; k++) {
                                                if (dbtype_list[k].id == factory_response.data[j].cluster_id) {
                                                    factory_response.data[j].cluster_name = dbtype_list[k].name;
                                                }
                                            }
                                        }
                                        dbtype_list[i].factorytype_list = factory_response.data;
                                        if (i = dbtype_list.length - 1) {
                                            that.reset(dbtype_list);
                                        }
                                    }
                                },
                                error: function(e) {}
                            });
                        }
                    }
                },
                error: function(e) {}
            });
        }
    });

    /*Factory*/
    exports.Collections.FactoryType = Backbone.Collection.extend({
        model: exports.Models.FactoryType,
        getList: function(cluster_id) {
            var that = this;
            $.ajax({
                url: '/api/udb/factorytypes',
                data: {
                    cluster_id: cluster_id,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {}
            });
        }
    });

    /*DB类型*/
    exports.Collections.InstanceType = Backbone.Collection.extend({
        model: exports.Models.InstanceType,
        getList: function() {
            var that = this;
            $.ajax({
                url: '/api/udb/instancetypes',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {}
            });
        }
    });

    /*DB配置文件*/
    exports.Collections.ParamGroup = Backbone.Collection.extend({
        model: exports.Models.ParamGroup,
        getList: function(db_type_id) {
            var that = this;
            $.ajax({
                url: '/api/udb/param',
                data: {
                    offset: 0,
                    max_count: 999,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        if (db_type_id) {
                            var param_group_list = new Array();
                            for (var i = 0, j = 0; i < response.data.length; i++) {
                                if (response.data[i].factory_id == db_type_id) {
                                    param_group_list[j] = response.data[i];
                                    j++;
                                }
                            }
                            that.reset(param_group_list);
                        } else {
                            that.reset(response.data);
                        }
                    }
                },
                error: function(e) {}
            });
        }
    });

    /*DB备份策略*/
    exports.Collections.BackupType = Backbone.Collection.extend({
        model: exports.Models.BackupType,
        getList: function() {
            var data = new Array();
            data['0'] = new Array();
            data['0']['id'] = 1;
            data['0']['description'] = '每周备份7次，每天3点开始，每隔24小时备份一次';
            this.reset(data);
        }
    });

    /*DB备份*/
    exports.Collections.Backup = Backbone.Collection.extend({
        model: exports.Models.Backup,
        getList: function(db_id) {
            var that = this;
            if (!db_id) {
                $.ajax({
                    url: '/api/udb/instances',
                    data: {
                        use_session: 'yes',
                        format: 'json',
                        db_kind: '2'
                    },
                    type: 'GET',
                    cache: false,
                    async: false,
                    dataType: 'json',
                    success: function(response) {
                        if (response.ret_code == 0) {
                            db_id = response.data[0].db_id;
                        }
                    },
                    error: function(e) {}
                });
            }
            $.ajax({
                url: '/api/udb/backup',
                data: {
                    use_session: 'yes',
                    offset: 0,
                    max_count: 999,
                    db_id: db_id,
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    /*DB配置*/
    exports.Collections.Param = Backbone.Collection.extend({
        model: exports.Models.Param,
        getList: function() {
            var that = this;
            var data = new Array();
            $.ajax({
                url: '/api/udb/param',
                data: {
                    use_session: 'yes',
                    offset: 0,
                    max_count: 999,
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        data = response.data;
                        that.reset(data);
                        $.ajax({
                            url: '/api/udb/clustertypes',
                            data: {
                                use_session: 'yes',
                                format: 'json'
                            },
                            type: 'GET',
                            cache: false,
                            dataType: 'json',
                            success: function(response) {
                                if (response.ret_code == 0) {
                                    var s = 0,
                                        i = 0;
                                    var db_type_list = new Array();
                                    var cluster_list = response.data;
                                    for (i = 0; i < cluster_list.length; i++) {
                                        $.ajax({
                                            url: '/api/udb/factorytypes',
                                            data: {
                                                cluster_id: cluster_list[i].id,
                                                use_session: 'yes',
                                                format: 'json'
                                            },
                                            type: 'GET',
                                            cache: false,
                                            dataType: 'json',
                                            success: function(factory_response) {
                                                if (factory_response.ret_code == 0) {
                                                    if (factory_response.data.length) {
                                                        for (var j = 0; j < factory_response.data.length; j++) {
                                                            for (var k = 0; k < cluster_list.length; k++) {
                                                                if (cluster_list[k].id == factory_response.data[j].cluster_id) {
                                                                    factory_response.data[j].cluster_name = cluster_list[k].name;
                                                                }
                                                            }
                                                            db_type_list[s] = factory_response.data[j];
                                                            s = s + 1;
                                                        }
                                                    }
                                                    if (i = cluster_list.length - 1) {
                                                        for (var m = 0; m < data.length; m++) {
                                                            for (var n = 0; n < db_type_list.length; n++) {
                                                                if (data[m].factory_id == db_type_list[n].id) {
                                                                    data[m].db_type_name = db_type_list[n].name;
                                                                    data[m].db_type = db_type_list[n].cluster_name;
                                                                }
                                                            }
                                                        }
                                                        that.reset(data);
                                                    }
                                                }
                                            },
                                            error: function(e) {}
                                        });
                                    }
                                }
                            },
                            error: function(e) {}
                        });
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        },
        comparator: function(model) {
            return model.get("id");
        }
    });

    exports.Collections.Udisk = Backbone.Collection.extend({
        model: exports.Models.Udisk,
        getList: function() {
            var that = this;
            $.ajax({
                url: '/api/udisks',
                data: {
                    use_session: 'yes',
                    offset: 0,
                    max_count: 20,
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.Snapshot = Backbone.Collection.extend({
        model: exports.Models.Snapshot,
        getList: function() {
            var that = this;
            $.ajax({
                url: '/api/snapshots',
                data: {
                    use_session: 'yes',
                    offset: 0,
                    max_count: 20,
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.NetInfo = Backbone.Collection.extend({
        model: exports.Models.NetInfo,
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/netinfo',
                data: {
                    use_session: 'yes',
                    offset: 0,
                    max_count: 20,
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data[0].net_type);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.UfirewallRule = Backbone.Collection.extend({
        model: exports.Models.UfirewallRule,
        getList: function(group_id, noasync) {
            var that = this;
            $.ajax({
                url: '/api/ufirewall/rules',
                data: {
                    group_id: group_id,
                    use_session: 'yes',
                    offset: 0,
                    max_count: 20,
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.Probe = Backbone.Collection.extend({
        model: exports.Models.Probe,
        getList: function(group_id, noasync) {
            var that = this;
            $.ajax({
                url: '/api/monitor/probes',
                data: {
                    group_id: group_id,
                    use_session: 'yes',
                    offset: 0,
                    max_count: 20,
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.AlarmTarget = Backbone.Collection.extend({
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/monitor/target',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.target = response.data;
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        },
        hasMail: function() {
            if (this.target && this.target.mail.length) {
                return true;
            }
            return false;
        },
        hasPhone: function() {
            if (this.target && this.target.phone.length) {
                return true;
            }
            return false;
        },
        getMail: function() {
            if (this.target && this.target.mail.length) {
                return this.target.mail;
            }
            return false;
        },
        getPhone: function() {
            if (this.target && this.target.phone.length) {
                return this.target.phone;
            }
            return false;
        },
        getMail2: function() {
            var emails = [],
                i = 0,
                _first;
            if (this.target && this.target.mail.length) {
                _.each(this.target.mail, function(mail) {
                    if (i == 0) {
                        _first = true;
                        emails.push({
                            mail: mail,
                            _first: _first
                        });
                    } else {
                        _first = false;
                        emails.push({
                            mail: mail,
                            _first: _first
                        });
                    }
                    i += 1;
                });
            }
            return emails;
        },
        getPhone2: function() {
            var phones = [],
                i = 0,
                _first;
            if (this.target && this.target.phone.length) {
                _.each(this.target.phone, function(phone) {
                    if (i == 0) {
                        _first = true;
                        phones.push({
                            phone: phone,
                            _first: _first
                        });
                    } else {
                        _first = false;
                        phones.push({
                            phone: phone,
                            _first: _first
                        });
                    }
                    i += 1;
                });
            }
            return phones;
        }
    });

    exports.Collections.Indicator = Backbone.Collection.extend({
        model: exports.Models.Indicator,
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/monitor/indicators',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });

        }
    });

    exports.Collections.Tag = Backbone.Collection.extend({
        model: exports.Models.Tag,
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/tags',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.MonitorCurrentData = Backbone.Collection.extend({
        model: exports.Models.MonitorCurrentData,
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/monitor/current_monitor_data',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.Palarm = Backbone.Collection.extend({
        model: exports.Models.Palarm,
        getList: function(data) {
            var that = this;
            $.ajax({
                url: '/api/monitor/palarm',
                data: {
                    offset: 0,
                    max_count: 1000,
                    begin_time: data.begin_time,
                    end_time: data.end_time,
                    alarm_type: data.alarm_type,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.Ucdn = Backbone.Collection.extend({
        model: exports.Models.Ucdn,
        getList: function(noasync) {
            var that = this;
            $.ajax({
                url: '/api/ucdn/sites',
                data: {
                    offset: 0,
                    offset: 100,
                    use_session: 'yes',
                    format: 'json'
                },
                type: 'GET',
                cache: false,
                dataType: 'json',
                async: noasync ? false : true,
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });

    exports.Collections.UcdnLog = Backbone.Collection.extend({
        model: exports.Models.UcdnLog,
        getList: function(data) {
            var that = this;
            data.use_session = 'yes';
            data.format = 'json';
            $.ajax({
                url: '/api/ucdn/log',
                data: data,
                type: 'GET',
                cache: false,
                dataType: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        that.reset(response.data.log_info);
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });


    exports.Collections.UcdnLogAnalysis = Backbone.Collection.extend({
        model: exports.Models.UcdnLogAnalysis,
        getList: function(data) {
            var that = this;
            data.use_session = 'yes';
            data.format = 'json';
            $.ajax({
                url: '/api/ucdn/loganalysis',
                data: data,
                type: 'GET',
                cache: false,
                datatype: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        for (var i = 0; i < response.data.length; i++) {
                            response.data[i].index = i + 1;
                            //response.data[i].file_size = (response.data[i].file_traffic/response.data[i].file_download_count) + "MB";
                            response.data[i].file_traffic = response.data[i].file_traffic + "MB";
                        }
                        that.reset(response.data);
                    } else {
                        that.trigger('flash', {
                            error: true
                        });
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });


    exports.Collections.UcdnLogAnalysisDomain = Backbone.Collection.extend({
        model: exports.Models.UcdnLogAnalysisDomain,
        getList: function(noasync) {
            var that = this;
            var data = Object();
            data.use_session = 'yes';
            data.format = 'json';
            $.ajax({
                url: '/api/ucdn/loganalysisdomain',
                data: data,
                type: 'GET',
                cache: false,
                async: noasync ? false : true,
                datatype: 'json',
                success: function(response) {
                    if (response.ret_code == 0) {
                        var res = response.data;
                        for (var i = 0; i < res.length; i++) {
                            var o = Object();
                            o.cdn_domain = res[i];
                            response.data[i] = o;
                        }
                        that.reset(response.data);
                    } else {
                        that.trigger('flash', {
                            error: true
                        });
                    }
                },
                error: function(e) {
                    that.trigger('flash', {
                        error: true
                    });
                }
            });
        }
    });



    exports.Collections.AccountTransaction = Backbone.Collection.extend({
        model: exports.Models.AccountTransaction,
        getList: function(start_time, end_time, bill_type, offset, max_count) {
            var that = this;
            start_time = Date.parse(start_time) / 1000;
            end_time = Date.parse(end_time) / 1000;
            $.ajax({
                url: '/account/user/getAccountTransaction',
                data: {
                    start_time: start_time,
                    end_time: end_time,
                    bill_type: bill_type,
                    offset: offset,
                    max_count: max_count
                },
                type: 'POST',
                dataType: 'json',
                success: function(response) {
                    that.reset(response);
                }
            });
            return this.total_count;

        },
        getCount: function(start_time, end_time, bill_type) {
            var that = this;
            start_time = Date.parse(start_time) / 1000;
            end_time = Date.parse(end_time) / 1000;
            $.ajax({
                url: '/account/user/getAccountTransactionCount',
                data: {
                    start_time: start_time,
                    end_time: end_time,
                    bill_type: bill_type
                },
                type: 'POST',
                async: false,
                dataType: 'json',
                success: function(response) {
                    that.total_count = response;
                }
            });
            return this.total_count;
        }
    });

    exports.Collections.AccountBill = Backbone.Collection.extend({
        model: exports.Models.AccountBill,
        getList: function(bill_time) {
            var that = this;
            $.ajax({
                url: '/account/user/getBillItem',
                data: {
                    bill_time: bill_time
                },
                type: 'GET',
                dataType: 'json',
                cache: false,
                async: false,
                success: function(response) {
                    that.total = response.total;
                    that.reset(response.uhost.uhost_bill);
                }
            });
        }
    });

    exports.Collections.SchedulerRule = Backbone.Collection.extend({
        model: exports.Models.SchedulerRule,
        getList: function() {
            var that = this;
            $.ajax({
                url: '/api/monitor/schedulerrules',
                type: 'GET',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                dataType: 'json',
                cache: false,
                async: false,
                success: function(response) {
                    that.reset(response.data);
                }
            });
        }
    });

    exports.Collections.SchedulerAction = Backbone.Collection.extend({
        model: exports.Models.SchedulerAction,
        getList: function() {
            var that = this;
            $.ajax({
                url: '/api/monitor/scheduleractions',
                type: 'GET',
                data: {
                    use_session: 'yes',
                    format: 'json'
                },
                dataType: 'json',
                cache: false,
                async: false,
                success: function(response) {
                    that.reset(response.data);
                }
            });
        }
    });

    exports.Collections.ConsoleLog = Backbone.Collection.extend({
        model: exports.Models.ConsoleLog,
        getList: function(begin_time, end_time, vmid) {
            var that = this;

            $.ajax({
                url: '/api/instance/consolelog_count',
                type: 'GET',
                data: {
                    use_session: 'yes',
                    format: 'json',
                    begin_time: begin_time,
                    end_time: end_time,
                    vmid: vmid
                },
                dataType: 'json',
                cache: false,
                global:false
            }).done(function(response) {
                if (response.ret_code == 0) {
                    $.ajax({
                        url: '/api/instance/consolelog',
                        type: 'GET',
                        data: {
                            use_session: 'yes',
                            format: 'json',
                            begin_time: begin_time,
                            end_time: end_time,
                            vmid: vmid,
                            offset: 0,
                            max_count: response.data
                        },
                        dataType: 'json',
                        cache: false,
                        async: false,
                        global:false
                    }).done(function(response) {
                        if (response.ret_code == 0) {
                            that.reset(response.data);
                        }
                    });
                }
            });
        }
    });
});
