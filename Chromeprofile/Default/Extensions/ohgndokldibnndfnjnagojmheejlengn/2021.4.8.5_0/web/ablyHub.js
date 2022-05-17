class AblyHub {
    constructor() {
        this.client;
        this.eventHandlers = [];
        this.id;
        this.connectionIdMessageKey = "ConnectionId";
        this.disconnectCounter = 0;
    }

    addClientToUserGroup(sub) {
        if (this.client.connection.state !== 'connected') {
            return;
        }

        let channel;

        if (account.webAppInfo.featureVersion < 2) {
            channel = this.client.channels.get(`citavi:user:${sub}:${this.id}`);
            telemetry.log(`Ably: Subscribing to "citavi:user:${sub}:${this.id}"`);
            channel.subscribe((message) => this.onMessage(message));
        }

        channel = this.client.channels.get(`citavi:group:${sub}:broadcast`);
        telemetry.log(`Ably: Subscribing to "citavi:group:${sub}:broadcast"`);
        channel.subscribe((message) => this.onMessage(message));
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                var options = {
                    authCallback: this.renewAblyToken,
                    authHeaders: {},
                    clientId: account.user.Contact.Key
                };

                this.client = new Ably.Realtime(options);
                this.disconnectCounter = 0;

                if (this.client.connection.state === 'connected') {
                    resolve(true);
                    return;
                }

                this.client.connection.on("connected", () => {
                    try {
                        this.disconnectCounter = 0;
                        this.id = this.client.connection.id;
                        telemetry.log("Ably connected: " + this.id);
                        this.addClientToUserGroup(account.user.Contact.Key);
                        resolve(true);
                    }
                    catch (e) {
                        telemetry.error(e);
                    }
                });

                this.client.connection.on(['failed', 'disconnected'], (ea) => {
                    try {
                        var handled = false;
                        if (ea.reason !== undefined && ea.reason !== null) {
                            if (ea.reason.message === "Connection to server temporarily unavailable") {
                                telemetry.warn("Ably connection failed", ea);
                                handled = true;
                            }
                            if (ea.reason.message === "Unclean disconnection of WebSocket ; code = 1006") {
                                telemetry.warn("Ably connection failed", ea);
                                handled = true;
                            }
                            if (ea.reason.message.indexOf("No activity seen from realtime in ") !== -1) {
                                telemetry.warn("Ably connection failed", ea);
                                handled = true;
                            }
                            if (ea.reason.statusCode === 401) {
                                telemetry.warn("Ably connection failed. 401. Stop connection. Logout", ea);
                                this.stop();
                                account.oauth.onLoggedOut();
                                return;
                            }
                        }

                        if (!handled) {
                            telemetry.error("Ably connection failed", ea);
                        }
                        
                        if (isNullOrUndefined(account.oauth.accessToken)) {
                            telemetry.warn("close ably connection. accessToken is undefined");
                            this.stop();
                            account.oauth.onLoggedOut();
                            return;
                        }
                        this.disconnectCounter++;
                        if (this.disconnectCounter > 10) {
                            telemetry.warn("close ably connection. too many exceptions");
                            this.stop();
                            account.oauth.onLoggedOut();
                            return;
                        }
                    }
                    catch (e) {
                        this.stop();
                        account.oauth.onLoggedOut();
                        telemetry.error(e);
                    }
                    finally {
                        if (resolve) {
                            resolve(false);
                        }
                    }
                });
            }
            catch (e) {
                telemetry.log(e);
            }
        });
    }

    async renewAblyToken(tokenParams, callback) {
        try {

            if (account.oauth.expires_at < Date.now()) {
                telemetry.log("renewAblyToken failed. AccessToken expired");
                this.stop();
                account.oauth.onLoggedOut();
                return;
            }

            var headers = {};

            headers["Authorization"] = `Bearer ${account.oauth.accessToken}`;
            headers["Client"] = runtimeInfo.id;
            headers["ClientVersion"] = runtimeInfo.pickerVersion;
            headers["SessionId"] = settings.aiSessionId;
            headers["ClientType"] = runtimeInfo.browserName + " Picker";

            let response = await fetch(settings.Authority + "api/ablyauth", {
                method: 'get',
                headers: headers,
            });
            telemetry.log("renewAblyToken: " + response.status);
            if (!response.ok) {
                if (response.status === 401) {
                    this.stop();
                    callback(new Error(response.statusText), json);
                    return;
                }
            }
            else {
                var json = await response.json();
                callback(null, json);
            }
        }
        catch (e) {
            telemetry.log(e);
            callback(e, null);
        }
    }

    registerEvent(eventName, callback) {
        if (callback == null) return;

        if (this.eventHandlers[eventName] == undefined) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(callback);
        return callback;
    };

    updateAccessToken(accessToken) {
        if (isNullOrUndefined(this.client)) {
            return;
        }
        telemetry.log("update ably accesstoken");
        this.client.options.authHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    stop() {
        try {
            this.client.connection.close();
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    async validate() {
        try {
            if (this.client.connection.state === 'connected') {
                return;
            }
            telemetry.log("reinit ably hub - current state: " + this.client.connection.state);
            await this.initialize();
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    unregisterEvent(eventName, callback) {
        if (callback == null) return;

        if (this.eventHandlers[eventName] == undefined) {
            return;
        }
        var index = this.eventHandlers[eventName].indexOf(callback);
        if (index == -1) {
            telemetry.warn("unregisterEvent called, but callback not found");
            return;
        }
        this.eventHandlers[eventName].splice(index, 1);
    };

    async onMessage(message) {
        try {

            var e = message.name;
            var v = message.data;

            if (account.webAppInfo.featureVersion >= 2) {
                if (!isNullOrUndefinedOrEmpty(message.data.ConnectionId) &&
                    this.id !== message.data.ConnectionId) {
                    telemetry.log(`Received ably message: ${e}. Skip other Client-Message.`);
                    return;
                }
            }
           
            telemetry.log("Received ably message: " + e, { data: v });

            if (e == "DisableOtherStartTabs") {
                return;
            }

            if (v == undefined) {
                telemetry.warn("Ably: onMessage, v is null", e);
                return;
            }

            telemetry.log("Ably: onMessage", { msg: v });

            if (v.Label === "ProjectProperties") {
                for (var projectRole of account.user.ProjectRoles) {
                    if (projectRole.ProjectKey === v.ProjectKey) {
                        if (v.ProjectName) {
                            projectRole.ProjectName = v.ProjectName;
                        }
                        if (v.ProjectColor) {
                            projectRole.ColorSchemeIdentifier = v.ProjectColor;
                        }
                        panel.broadcast({ action: MessageKeys.onLoggedIn });
                        break;
                    }
                }
            }

            

            if (v.Label === "BroadcastSettingChange") {
                if (v.Value.indexOf("KnownProjects") !== -1) {
                    telemetry.log("KnownProjects changed");
                    await account.getProjects();
                    panel.broadcast({ action: MessageKeys.onLoggedIn });
                }
            }

            var hdls;
            if (!isNullOrUndefined(this.eventHandlers[v.Label])) {
                hdls = this.eventHandlers[v.Label];
                for (var i = 0; i < hdls.length; i++) {
                    hdls[i](e, v);
                }
            }

            if (v.JobId && !isNullOrUndefined(this.eventHandlers[v.JobId])) {
                hdls = this.eventHandlers[v.JobId];
                for (var i = 0; i < hdls.length; i++) {
                    hdls[i](e, v);
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
    };
}