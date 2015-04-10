// tableau_v8.js
(function() {
	var ss = {
		version: '0.7.4.0',
		isUndefined: function(o) {
			return (o === undefined);
		},
		isNull: function(o) {
			return (o === null);
		},
		isNullOrUndefined: function(o) {
			return (o === null) || (o === undefined);
		},
		isValue: function(o) {
			return (o !== null) && (o !== undefined);
		}
	};
	var Type = Function;
	var originalRegistrationFunctions = {
		registerNamespace: {
			isPrototype: false,
			func: Type.registerNamespace
		},
		registerInterface: {
			isPrototype: true,
			func: Type.prototype.registerInterface
		},
		registerClass: {
			isPrototype: true,
			func: Type.prototype.registerClass
		},
		registerEnum: {
			isPrototype: true,
			func: Type.prototype.registerEnum
		}
	};
	var tab = {};
	var tabBootstrap = {};
	Type.registerNamespace = function(name) {
		if (name === "tableauSoftware") {
			window.tableauSoftware = window.tableauSoftware || {};
		}
	};
	Type.prototype.registerInterface = function(name) {};
	Type.prototype.registerEnum = function(name, flags) {
		for (var field in this.prototype) {
			this[field] = this.prototype[field];
		}
	};
	Type.prototype.registerClass = function(name, baseType, interfaceType) {
		var that = this;
		this.prototype.constructor = this;
		this.__baseType = baseType || Object;
		if (baseType) {
			this.__basePrototypePending = true;
			this.__setupBase = function() {
				Type$setupBase(that);
			};
			this.initializeBase = function(instance, args) {
				Type$initializeBase(that, instance, args);
			};
			this.callBaseMethod = function(instance, name, args) {
				Type$callBaseMethod(that, instance, name, args);
			};
		}
	};

	function Type$setupBase(that) {
		if (that.__basePrototypePending) {
			var baseType = that.__baseType;
			if (baseType.__basePrototypePending) {
				baseType.__setupBase();
			}
			for (var memberName in baseType.prototype) {
				var memberValue = baseType.prototype[memberName];
				if (!that.prototype[memberName]) {
					that.prototype[memberName] = memberValue;
				}
			}
			delete that.__basePrototypePending;
			delete that.__setupBase;
		}
	}

	function Type$initializeBase(that, instance, args) {
		if (that.__basePrototypePending) {
			that.__setupBase();
		}
		if (!args) {
			that.__baseType.apply(instance);
		} else {
			that.__baseType.apply(instance, args);
		}
	}

	function Type$callBaseMethod(that, instance, name, args) {
		var baseMethod = that.__baseType.prototype[name];
		if (!args) {
			return baseMethod.apply(instance);
		} else {
			return baseMethod.apply(instance, args);
		}
	}

	function restoreTypeSystem() {
		for (var regFuncName in originalRegistrationFunctions) {
			if (!originalRegistrationFunctions.hasOwnProperty(regFuncName)) {
				continue;
			}
			var original = originalRegistrationFunctions[regFuncName];
			var typeOrPrototype = original.isPrototype ? Type.prototype : Type;
			if (original.func) {
				typeOrPrototype[regFuncName] = original.func;
			} else {
				delete typeOrPrototype[regFuncName];
			}
		}
	}
	ss.Delegate = function Delegate$() {};
	ss.Delegate.registerClass('Delegate');
	ss.Delegate.empty = function() {};
	ss.Delegate._contains = function Delegate$_contains(targets, object, method) {
		for (var i = 0; i < targets.length; i += 2) {
			if (targets[i] === object && targets[i + 1] === method) {
				return true;
			}
		}
		return false;
	};
	ss.Delegate._create = function Delegate$_create(targets) {
		var delegate = function() {
			if (targets.length == 2) {
				return targets[1].apply(targets[0], arguments);
			} else {
				var clone = targets.concat();
				for (var i = 0; i < clone.length; i += 2) {
					if (ss.Delegate._contains(targets, clone[i], clone[i + 1])) {
						clone[i + 1].apply(clone[i], arguments);
					}
				}
				return null;
			}
		};
		delegate._targets = targets;
		return delegate;
	};
	ss.Delegate.create = function Delegate$create(object, method) {
		if (!object) {
			return method;
		}
		return ss.Delegate._create([object, method]);
	};
	ss.Delegate.combine = function Delegate$combine(delegate1, delegate2) {
		if (!delegate1) {
			if (!delegate2._targets) {
				return ss.Delegate.create(null, delegate2);
			}
			return delegate2;
		}
		if (!delegate2) {
			if (!delegate1._targets) {
				return ss.Delegate.create(null, delegate1);
			}
			return delegate1;
		}
		var targets1 = delegate1._targets ? delegate1._targets : [null, delegate1];
		var targets2 = delegate2._targets ? delegate2._targets : [null, delegate2];
		return ss.Delegate._create(targets1.concat(targets2));
	};
	ss.Delegate.remove = function Delegate$remove(delegate1, delegate2) {
		if (!delegate1 || (delegate1 === delegate2)) {
			return null;
		}
		if (!delegate2) {
			return delegate1;
		}
		var targets = delegate1._targets;
		var object = null;
		var method;
		if (delegate2._targets) {
			object = delegate2._targets[0];
			method = delegate2._targets[1];
		} else {
			method = delegate2;
		}
		for (var i = 0; i < targets.length; i += 2) {
			if ((targets[i] === object) && (targets[i + 1] === method)) {
				if (targets.length == 2) {
					return null;
				}
				targets.splice(i, 2);
				return ss.Delegate._create(targets);
			}
		}
		return delegate1;
	};
	ss.IEnumerator = function IEnumerator$() {};
	ss.IEnumerator.prototype = {
		get_current: null,
		moveNext: null,
		reset: null
	};
	ss.IEnumerator.getEnumerator = function ss_IEnumerator$getEnumerator(enumerable) {
		if (enumerable) {
			return enumerable.getEnumerator ? enumerable.getEnumerator() : new ss.ArrayEnumerator(enumerable);
		}
		return null;
	}
	ss.IEnumerable = function IEnumerable$() {};
	ss.IEnumerable.prototype = {
		getEnumerator: null
	};
	ss.ArrayEnumerator = function ArrayEnumerator$(array) {
		this._array = array;
		this._index = -1;
		this.current = null;
	}
	ss.ArrayEnumerator.prototype = {
		moveNext: function ArrayEnumerator$moveNext() {
			this._index++;
			this.current = this._array[this._index];
			return (this._index < this._array.length);
		},
		reset: function ArrayEnumerator$reset() {
			this._index = -1;
			this.current = null;
		}
	};
	ss.IDisposable = function IDisposable$() {};
	ss.IDisposable.prototype = {
		dispose: null
	};
	ss.StringBuilder = function StringBuilder$(s) {
		this._parts = !ss.isNullOrUndefined(s) ? [s] : [];
		this.isEmpty = this._parts.length == 0;
	}
	ss.StringBuilder.prototype = {
		append: function StringBuilder$append(s) {
			if (!ss.isNullOrUndefined(s)) {
				this._parts.push(s);
				this.isEmpty = false;
			}
			return this;
		},
		appendLine: function StringBuilder$appendLine(s) {
			this.append(s);
			this.append('\r\n');
			this.isEmpty = false;
			return this;
		},
		clear: function StringBuilder$clear() {
			this._parts = [];
			this.isEmpty = true;
		},
		toString: function StringBuilder$toString(s) {
			return this._parts.join(s || '');
		}
	};
	ss.StringBuilder.registerClass('StringBuilder');
	ss.EventArgs = function EventArgs$() {}
	ss.EventArgs.registerClass('EventArgs');
	ss.EventArgs.Empty = new ss.EventArgs();
	ss.CancelEventArgs = function CancelEventArgs$() {
		ss.CancelEventArgs.initializeBase(this);
		this.cancel = false;
	}
	ss.CancelEventArgs.registerClass('CancelEventArgs', ss.EventArgs);
	ss.Tuple = function(first, second, third) {
		this.first = first;
		this.second = second;
		if (arguments.length == 3) {
			this.third = third;
		}
	}
	ss.Tuple.registerClass('Tuple');
	Type.registerNamespace('tab');
	tab.EscapingUtil = function() {}
	tab.EscapingUtil.escapeHtml = function(html) {
		var $0 = (html || '');
		$0 = $0.replace(new RegExp('&', 'g'), '&amp;');
		$0 = $0.replace(new RegExp('<', 'g'), '&lt;');
		$0 = $0.replace(new RegExp('>', 'g'), '&gt;');
		$0 = $0.replace(new RegExp('"', 'g'), '&quot;');
		$0 = $0.replace(new RegExp("'", 'g'), '&#39;');
		$0 = $0.replace(new RegExp('/', 'g'), '&#47;');
		return $0;
	}
	tab.WindowHelper = function(window) {
		this.$6 = window;
	}
	tab.WindowHelper.close = function(window) {
		window.close();
	}
	tab.WindowHelper.getOpener = function(window) {
		return window.opener;
	}
	tab.WindowHelper.getLocation = function(window) {
		return window.location;
	}
	tab.WindowHelper.setLocationHref = function(window, href) {
		window.location.href = href;
	}
	tab.WindowHelper.locationReplace = function(window, url) {
		window.location.replace(url);
	}
	tab.WindowHelper.clearLocationHash = function(loc) {
		var $0 = loc.href;
		$0 = $0.substr(0, $0.length - loc.hash.length);
		if ($0.charAt($0.length - 1) === '#') {
			$0 = $0.substr(0, $0.length - 1);
		}
		return $0;
	}
	tab.WindowHelper.updateURLRetryInfo = function(loc, url, addRetryInfo) {
		var $0 = loc.search;
		var $1 = $0.indexOf(':retry=true');
		if (addRetryInfo) {
			if ($1 === -1) {
				if (!$0.length) {
					url += '?' + ':retry=true';
				} else {
					url = url.replace($0, $0 + '&' + ':retry=true');
				}
			}
		} else {
			if ($1 !== -1) {
				var $2 = '';
				if ($0 !== '?' + ':retry=true') {
					$2 = $0.replace('&' + ':retry=true', '');
				}
				url = url.replace($0, $2);
			}
		}
		return url;
	}
	tab.WindowHelper.open = function(href, target) {
		window.open(href, target);
	}
	tab.WindowHelper.reload = function(w, foreGet) {
		w.location.reload(foreGet);
	}
	tab.WindowHelper.requestAnimationFrame = function(action) {
		return tab.WindowHelper.$4(action);
	}
	tab.WindowHelper.cancelAnimationFrame = function(animationId) {
		if (ss.isValue(animationId)) {
			tab.WindowHelper.$5(animationId);
		}
	}
	tab.WindowHelper.reloadLocation = function(addRetryInfo) {
		var $0 = tab.WindowHelper.clearLocationHash(window.location);
		$0 = tab.WindowHelper.updateURLRetryInfo(window.location, $0, addRetryInfo);
		window.location.replace($0);
	}
	tab.WindowHelper.locationIndicatesRetry = function() {
		return window.location.search.indexOf(':retry=true') !== -1;
	}
	tab.WindowHelper.$7 = function() {
		var $0 = 0;
		tab.WindowHelper.$4 = function($p1_0) {
			var $1_0 = new Date().getTime();
			var $1_1 = Math.max(0, 16 - ($1_0 - $0));
			$0 = $1_0 + $1_1;
			var $1_2 = window.setTimeout(function() {
				$p1_0();
			}, $1_1);
			return $1_2;
		};
	}
	tab.WindowHelper.prototype = {
		$6: null,
		get_pageXOffset: function() {
			return tab.WindowHelper.$2(this.$6);
		},
		get_pageYOffset: function() {
			return tab.WindowHelper.$3(this.$6);
		},
		get_innerWidth: function() {
			return tab.WindowHelper.$0(this.$6);
		},
		get_innerHeight: function() {
			return tab.WindowHelper.$1(this.$6);
		}
	}
	tab.EscapingUtil.registerClass('tab.EscapingUtil');
	tab.WindowHelper.registerClass('tab.WindowHelper');
	tab.WindowHelper.retryString = ':retry=true';
	tab.WindowHelper.$0 = null;
	tab.WindowHelper.$1 = null;
	tab.WindowHelper.$2 = null;
	tab.WindowHelper.$3 = null;
	tab.WindowHelper.$4 = null;
	tab.WindowHelper.$5 = null;
	(function() {
		if (('innerWidth' in window)) {
			tab.WindowHelper.$0 = function($p1_0) {
				return $p1_0.innerWidth;
			};
		} else {
			tab.WindowHelper.$0 = function($p1_0) {
				return $p1_0.document.documentElement.offsetWidth;
			};
		} if (('innerHeight' in window)) {
			tab.WindowHelper.$1 = function($p1_0) {
				return $p1_0.innerHeight;
			};
		} else {
			tab.WindowHelper.$1 = function($p1_0) {
				return $p1_0.document.documentElement.offsetHeight;
			};
		} if (ss.isValue(window.self.pageXOffset)) {
			tab.WindowHelper.$2 = function($p1_0) {
				return $p1_0.pageXOffset;
			};
		} else {
			tab.WindowHelper.$2 = function($p1_0) {
				return $p1_0.document.documentElement.scrollLeft;
			};
		} if (ss.isValue(window.self.pageYOffset)) {
			tab.WindowHelper.$3 = function($p1_0) {
				return $p1_0.pageYOffset;
			};
		} else {
			tab.WindowHelper.$3 = function($p1_0) {
				return $p1_0.document.documentElement.scrollTop;
			};
		}
		var $0 = 'requestAnimationFrame';
		var $1 = 'cancelAnimationFrame';
		var $2 = ['ms', 'moz', 'webkit', 'o'];
		var $3 = null;
		var $4 = null;
		if (($0 in window)) {
			$3 = $0;
		}
		if (($1 in window)) {
			$4 = $1;
		}
		for (var $5 = 0; $5 < $2.length && ($3 == null || $4 == null); ++$5) {
			var $6 = $2[$5];
			var $7 = $6 + 'RequestAnimationFrame';
			if ($3 == null && ($7 in window)) {
				$3 = $7;
			}
			if ($4 == null) {
				$7 = $6 + 'CancelAnimationFrame';
				if (($7 in window)) {
					$4 = $7;
				}
				$7 = $6 + 'CancelRequestAnimationFrame';
				if (($7 in window)) {
					$4 = $7;
				}
			}
		}
		if ($3 != null) {
			tab.WindowHelper.$4 = function($p1_0) {
				return window[$3]($p1_0);
			};
		} else {
			tab.WindowHelper.$7();
		} if ($4 != null) {
			tab.WindowHelper.$5 = function($p1_0) {
				window[$4]($p1_0);
			};
		} else {
			tab.WindowHelper.$5 = function($p1_0) {
				window.clearTimeout($p1_0);
			};
		}
	})();
	Type.registerNamespace('tab');
	tab.$create__SheetInfoImpl = function(name, sheetType, index, size, workbook, url, isActive, isHidden, zoneId) {
		var $o = {};
		$o.name = name;
		$o.sheetType = sheetType;
		$o.index = index;
		$o.size = size;
		$o.workbook = workbook;
		$o.url = url;
		$o.isActive = isActive;
		$o.isHidden = isHidden;
		$o.zoneId = zoneId;
		return $o;
	}
	tab.$create_JavaScriptApi$2 = function(name, objectType, position, size, zoneId) {
		var $o = {};
		$o.$1 = name;
		$o.$0 = objectType;
		$o.$2 = position;
		$o.$3 = size;
		$o.$4 = zoneId;
		return $o;
	}
	tab.$create__StoryPointInfoImpl = function(caption, index, storyPointId, isActive, isUpdated, parentStoryImpl) {
		var $o = {};
		$o.caption = caption;
		$o.index = index;
		$o.storyPointId = storyPointId;
		$o.isActive = isActive;
		$o.isUpdated = isUpdated;
		$o.parentStoryImpl = parentStoryImpl;
		return $o;
	}
	tab._ApiCommand = function(name, sourceId, handlerId, parameters) {
		this.$0 = name;
		this.$2 = sourceId;
		this.$1 = handlerId;
		this.$3 = parameters;
	}
	tab._ApiCommand.parse = function(serialized) {
		var $0;
		var $1 = serialized.indexOf(',');
		if ($1 < 0) {
			$0 = serialized;
			return new tab._ApiCommand($0, null, null, null);
		}
		$0 = serialized.substr(0, $1);
		var $2;
		var $3 = serialized.substr($1 + 1);
		$1 = $3.indexOf(',');
		if ($1 < 0) {
			$2 = $3;
			return new tab._ApiCommand($0, $2, null, null);
		}
		$2 = $3.substr(0, $1);
		var $4;
		var $5 = $3.substr($1 + 1);
		$1 = $5.indexOf(',');
		if ($1 < 0) {
			$4 = $5;
			return new tab._ApiCommand($0, $2, $4, null);
		}
		$4 = $5.substr(0, $1);
		var $6 = $5.substr($1 + 1);
		return new tab._ApiCommand($0, $2, $4, $6);
	}
	tab._ApiCommand.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: null,
		get_name: function() {
			return this.$0;
		},
		get_handlerId: function() {
			return this.$1;
		},
		get_sourceId: function() {
			return this.$2;
		},
		get_parameters: function() {
			return this.$3;
		},
		get_isApiCommandName: function() {
			return !this.get_rawName().indexOf('api.', 0);
		},
		get_rawName: function() {
			return this.$0;
		},
		serialize: function() {
			var $0 = [];
			$0.push(this.$0);
			$0.push(this.$2);
			$0.push(this.$1);
			if (ss.isValue(this.$3)) {
				$0.push(this.$3);
			}
			var $1 = $0.join(',');
			return $1;
		}
	}
	tab._ApiServerResultParser = function(serverResult) {
		var $0 = JSON.parse(serverResult);
		this.$0 = $0['api.commandResult'];
		this.$1 = $0['api.commandData'];
	}
	tab._ApiServerResultParser.prototype = {
		$0: null,
		$1: null,
		get_result: function() {
			return this.$0;
		},
		get_data: function() {
			return this.$1;
		}
	}
	tab.JavaScriptApi$4 = function(serverResult) {
		var $0 = JSON.parse(serverResult);
		this.$0 = $0['api.workbookName'];
		this.$1 = $0['api.worksheetName'];
		this.$2 = $0['api.commandData'];
	}
	tab.JavaScriptApi$4.prototype = {
		$0: null,
		$1: null,
		$2: null,
		get_$3: function() {
			return this.$0;
		},
		get_$4: function() {
			return this.$1;
		},
		get_$5: function() {
			return this.$2;
		}
	}
	tab._CommandReturnHandler = function(commandName, successCallbackTiming, successCallback, errorCallback) {
		this.$0 = commandName;
		this.$2 = successCallback;
		this.$1 = successCallbackTiming;
		this.$3 = errorCallback;
	}
	tab._CommandReturnHandler.prototype = {
		$0: null,
		$1: 0,
		$2: null,
		$3: null,
		get_commandName: function() {
			return this.$0;
		},
		get_successCallback: function() {
			return this.$2;
		},
		get_successCallbackTiming: function() {
			return this.$1;
		},
		get_errorCallback: function() {
			return this.$3;
		}
	}
	tab.JavaScriptApi$1 = function() {
		this.$2 = {};
		this.$3 = {};
		this.$4 = {};
		this.$5 = {};
		if (tab._Utility.hasWindowAddEventListener()) {
			window.addEventListener('message', this.$8(), false);
		} else if (tab._Utility.hasDocumentAttachEvent()) {
			document.attachEvent('onmessage', this.$8());
			window.attachEvent('onmessage', this.$8());
		} else {
			window.onmessage = this.$8();
		}
		this.$0 = this.$1 = 0;
	}
	tab.JavaScriptApi$1.prototype = {
		$0: 0,
		$1: 0,
		registerHandler: function($p0) {
			var $0 = 'handler' + this.$0;
			if (ss.isValue($p0.get_handlerId()) || ss.isValue(this.$2[$p0.get_handlerId()])) {
				throw tab._TableauException.createInternalError("Handler '" + $p0.get_handlerId() + "' is already registered.");
			}
			this.$0++;
			$p0.set_handlerId($0);
			this.$2[$0] = $p0;
			$p0.add_customViewsListLoad(ss.Delegate.create(this, this.$6));
			$p0.add_stateReadyForQuery(ss.Delegate.create(this, this.$7));
		},
		unregisterHandler: function($p0) {
			if (ss.isValue($p0.get_handlerId()) || ss.isValue(this.$2[$p0.get_handlerId()])) {
				delete this.$2[$p0.get_handlerId()];
				$p0.remove_customViewsListLoad(ss.Delegate.create(this, this.$6));
				$p0.remove_stateReadyForQuery(ss.Delegate.create(this, this.$7));
			}
		},
		sendCommand: function($p0, $p1, $p2) {
			var $0 = $p0.get_iframe();
			var $1 = $p0.get_handlerId();
			if (!tab._Utility.hasWindowPostMessage() || ss.isNullOrUndefined($0) || ss.isNullOrUndefined($0.contentWindow)) {
				return;
			}
			var $2 = 'cmd' + this.$1;
			this.$1++;
			var $3 = this.$3[$1];
			if (ss.isNullOrUndefined($3)) {
				$3 = {};
				this.$3[$1] = $3;
			}
			$3[$2] = $p2;
			var $4 = $p2.get_commandName();
			if ($4 === 'api.ShowCustomViewCommand') {
				var $8 = this.$4[$1];
				if (ss.isNullOrUndefined($8)) {
					$8 = {};
					this.$4[$1] = $8;
				}
				$8[$2] = $p2;
			}
			var $5 = null;
			if (ss.isValue($p1)) {
				$5 = tab.JsonUtil.toJson($p1, false, '');
			}
			var $6 = new tab._ApiCommand($4, $2, $1, $5);
			var $7 = $6.serialize();
			if (tab._Utility.isPostMessageSynchronous()) {
				window.setTimeout(function() {
					$0.contentWindow.postMessage($7, $p0.get_serverRoot());
				}, 0);
			} else {
				$0.contentWindow.postMessage($7, $p0.get_serverRoot());
			}
		},
		$6: function($p0) {
			var $0 = $p0.get_handlerId();
			var $1 = this.$4[$0];
			if (ss.isNullOrUndefined($1)) {
				return;
			}
			var $dict1 = $1;
			for (var $key2 in $dict1) {
				var $2 = {
					key: $key2,
					value: $dict1[$key2]
				};
				var $3 = $2.value;
				if (ss.isValue($3.get_successCallback())) {
					$3.get_successCallback()(null);
				}
			}
			delete this.$4[$0];
		},
		$7: function($p0) {
			var $0 = this.$5[$p0.get_handlerId()];
			if (tab._Utility.isNullOrEmpty($0)) {
				return;
			}
			while ($0.length > 0) {
				var $1 = $0.pop();
				if (ss.isValue($1)) {
					$1();
				}
			}
		},
		$8: function() {
			return ss.Delegate.create(this, function($p1_0) {
				this.$9($p1_0);
			});
		},
		$9: function($p0) {
			if (ss.isNullOrUndefined($p0.data)) {
				return;
			}
			var $0 = tab._ApiCommand.parse($p0.data);
			var $1 = $0.get_rawName();
			var $2 = $0.get_handlerId();
			var $3 = this.$2[$2];
			if (ss.isNullOrUndefined($3) || $3.get_handlerId() !== $0.get_handlerId()) {
				$3 = new tab.JavaScriptApi$0();
			}
			if ($0.get_isApiCommandName()) {
				if ($0.get_sourceId() === 'xdomainSourceId') {
					$3.handleEventNotification($0.get_name(), $0.get_parameters());
				} else {
					this.$A($0);
				}
			} else {
				this.$B($1, $p0, $3);
			}
		},
		$A: function($p0) {
			var $0 = this.$3[$p0.get_handlerId()];
			var $1 = (ss.isValue($0)) ? $0[$p0.get_sourceId()] : null;
			if (ss.isNullOrUndefined($1)) {
				return;
			}
			delete $0[$p0.get_sourceId()];
			if ($p0.get_name() !== $1.get_commandName()) {
				return;
			}
			var $2 = new tab._ApiServerResultParser($p0.get_parameters());
			var $3 = $2.get_data();
			if ($2.get_result() === 'api.success') {
				switch ($1.get_successCallbackTiming()) {
					case 0:
						if (ss.isValue($1.get_successCallback())) {
							$1.get_successCallback()($3);
						}
						break;
					case 1:
						var $4 = function() {
							if (ss.isValue($1.get_successCallback())) {
								$1.get_successCallback()($3);
							}
						};
						var $5 = this.$5[$p0.get_handlerId()];
						if (ss.isNullOrUndefined($5)) {
							$5 = [];
							this.$5[$p0.get_handlerId()] = $5;
						}
						$5.push($4);
						break;
					default:
						throw tab._TableauException.createInternalError('Unknown timing value: ' + $1.get_successCallbackTiming());
				}
			} else if (ss.isValue($1.get_errorCallback())) {
				var $6 = $2.get_result() === 'api.remotefailed';
				$1.get_errorCallback()($6, $3);
			}
		},
		$B: function($p0, $p1, $p2) {
			if ($p0 === 'tableau.loadIndicatorsLoaded') {
				var $dict1 = this.$2;
				for (var $key2 in $dict1) {
					var $0 = {
						key: $key2,
						value: $dict1[$key2]
					};
					if (tab._Utility.hasOwnProperty(this.$2, $0.key) && $0.value.get_iframe().contentWindow === $p1.source) {
						$0.value.hideLoadIndicators();
						break;
					}
				}
			} else if ($p0 === 'layoutInfoReq') {
				this.$C($p1.source);
			} else if ($p0 === 'tableau.completed' || $p0 === 'completed' || $p0 === 'layoutInfoReq') {
				$p2.handleVizLoad();
			}
		},
		$C: function($p0) {
			if (!tab._Utility.hasWindowPostMessage()) {
				return;
			}
			var $0 = new tab.WindowHelper(window.self);
			var $1 = (ss.isValue($0.get_innerWidth())) ? $0.get_innerWidth() : document.documentElement.offsetWidth;
			var $2 = (ss.isValue($0.get_innerHeight())) ? $0.get_innerHeight() : document.documentElement.offsetHeight;
			var $3 = (ss.isValue($0.get_pageXOffset())) ? $0.get_pageXOffset() : document.documentElement.scrollLeft;
			var $4 = (ss.isValue($0.get_pageYOffset())) ? $0.get_pageYOffset() : document.documentElement.scrollTop;
			var $5 = [];
			$5.push('layoutInfoResp');
			$5.push($3);
			$5.push($4);
			$5.push($1);
			$5.push($2);
			$p0.postMessage($5.join(','), '*');
		}
	}
	tab.JavaScriptApi$0 = function() {}
	tab.JavaScriptApi$0.prototype = {
		$0: null,
		add_customViewsListLoad: function($p0) {
			this.$1 = ss.Delegate.combine(this.$1, $p0);
		},
		remove_customViewsListLoad: function($p0) {
			this.$1 = ss.Delegate.remove(this.$1, $p0);
		},
		$1: null,
		add_stateReadyForQuery: function($p0) {
			this.$2 = ss.Delegate.combine(this.$2, $p0);
		},
		remove_stateReadyForQuery: function($p0) {
			this.$2 = ss.Delegate.remove(this.$2, $p0);
		},
		$2: null,
		get_iframe: function() {
			return null;
		},
		get_handlerId: function() {
			return this.$0;
		},
		set_handlerId: function($p0) {
			this.$0 = $p0;
			return $p0;
		},
		get_serverRoot: function() {
			return '*';
		},
		hideLoadIndicators: function() {},
		handleVizLoad: function() {},
		handleEventNotification: function($p0, $p1) {},
		$3: function() {
			this.$1(null);
			this.$2(null);
		}
	}
	tab.CrossDomainMessagingOptions = function(router, handler) {
		tab._Param.verifyValue(router, 'router');
		tab._Param.verifyValue(handler, 'handler');
		this.$0 = router;
		this.$1 = handler;
	}
	tab.CrossDomainMessagingOptions.prototype = {
		$0: null,
		$1: null,
		get_router: function() {
			return this.$0;
		},
		get_handler: function() {
			return this.$1;
		},
		sendCommand: function(commandParameters, returnHandler) {
			this.$0.sendCommand(this.$1, commandParameters, returnHandler);
		}
	}
	tab._Enums = function() {}
	tab._Enums.$0 = function($p0, $p1) {
		var $0 = (ss.isValue($p0)) ? $p0 : '';
		return tab._Enums.$8($0, $p1, tableauSoftware.PeriodType, true);
	}
	tab._Enums.$1 = function($p0, $p1) {
		var $0 = (ss.isValue($p0)) ? $p0 : '';
		return tab._Enums.$8($0, $p1, tableauSoftware.DateRangeType, true);
	}
	tab._Enums.$2 = function($p0, $p1) {
		var $0 = (ss.isValue($p0)) ? $p0 : '';
		return tab._Enums.$8($0, $p1, tableauSoftware.FilterUpdateType, true);
	}
	tab._Enums.$3 = function($p0, $p1) {
		var $0 = (ss.isValue($p0)) ? $p0 : '';
		return tab._Enums.$8($0, $p1, tableauSoftware.SelectionUpdateType, true);
	}
	tab._Enums.$4 = function($p0) {
		var $0 = (ss.isValue($p0)) ? $p0.toString() : '';
		return tab._Enums.$8($0, '', tableauSoftware.SelectionUpdateType, false) != null;
	}
	tab._Enums.$5 = function($p0, $p1) {
		var $0 = (ss.isValue($p0)) ? $p0 : '';
		return tab._Enums.$8($0, $p1, tableauSoftware.NullOption, true);
	}
	tab._Enums.$6 = function($p0, $p1) {
		var $0 = (ss.isValue($p0)) ? $p0 : '';
		return tab._Enums.$8($0, $p1, tableauSoftware.SheetSizeBehavior, true);
	}
	tab._Enums.$7 = function($p0) {
		var $0 = (ss.isValue($p0)) ? $p0 : '';
		return tab._Enums.$8($0, '', tableauSoftware.TableauEventName, false);
	}
	tab._Enums.$8 = function($p0, $p1, $p2, $p3) {
		if (ss.isValue($p0)) {
			var $0 = $p0.toString().toUpperCase();
			var $dict1 = $p2;
			for (var $key2 in $dict1) {
				var $1 = {
					key: $key2,
					value: $dict1[$key2]
				};
				var $2 = $1.value.toString().toUpperCase();
				if ($0 === $2) {
					return $1.value;
				}
			}
		}
		if ($p3) {
			throw tab._TableauException.createInvalidParameter($p1);
		}
		return null;
	}
	tab._ApiBootstrap = function() {}
	tab._ApiBootstrap.initialize = function() {
		tab._ApiObjectRegistry.registerCrossDomainMessageRouter(function() {
			return new tab.JavaScriptApi$1();
		});
	}
	tab._ApiObjectRegistry = function() {}
	tab._ApiObjectRegistry.registerCrossDomainMessageRouter = function(objectCreationFunc) {
		return tab._ApiObjectRegistry.$3('ICrossDomainMessageRouter', objectCreationFunc);
	}
	tab._ApiObjectRegistry.getCrossDomainMessageRouter = function() {
		return tab._ApiObjectRegistry.$5('ICrossDomainMessageRouter');
	}
	tab._ApiObjectRegistry.disposeCrossDomainMessageRouter = function() {
		tab._ApiObjectRegistry.$6('ICrossDomainMessageRouter');
	}
	tab._ApiObjectRegistry.$3 = function($p0, $p1) {
		if (ss.isNullOrUndefined(tab._ApiObjectRegistry.$1)) {
			tab._ApiObjectRegistry.$1 = {};
		}
		var $0 = tab._ApiObjectRegistry.$1[$p0];
		tab._ApiObjectRegistry.$1[$p0] = $p1;
		return $0;
	}
	tab._ApiObjectRegistry.$4 = function($p0) {
		if (ss.isNullOrUndefined(tab._ApiObjectRegistry.$1)) {
			throw tab._TableauException.createInternalError('No types registered');
		}
		var $0 = tab._ApiObjectRegistry.$1[$p0];
		if (ss.isNullOrUndefined($0)) {
			throw tab._TableauException.createInternalError("No creation function has been registered for interface type '" + $p0 + "'.");
		}
		var $1 = $0();
		return $1;
	}
	tab._ApiObjectRegistry.$5 = function($p0) {
		if (ss.isNullOrUndefined(tab._ApiObjectRegistry.$2)) {
			tab._ApiObjectRegistry.$2 = {};
		}
		var $0 = tab._ApiObjectRegistry.$2[$p0];
		if (ss.isNullOrUndefined($0)) {
			$0 = tab._ApiObjectRegistry.$4($p0);
			tab._ApiObjectRegistry.$2[$p0] = $0;
		}
		return $0;
	}
	tab._ApiObjectRegistry.$6 = function($p0) {
		if (ss.isNullOrUndefined(tab._ApiObjectRegistry.$2)) {
			return null;
		}
		var $0 = tab._ApiObjectRegistry.$2[$p0];
		delete tab._ApiObjectRegistry.$2[$p0];
		return $0;
	}
	tab._CustomViewImpl = function(workbookImpl, name, messagingOptions) {
		this.$2 = workbookImpl;
		this.$4 = name;
		this.$3 = messagingOptions;
		this.$7 = false;
		this.$8 = false;
		this.$9 = false;
	}
	tab._CustomViewImpl._getAsync = function($p0) {
		var $0 = new tab._Deferred();
		$0.resolve($p0.get__customViewImpl().get_$A());
		return $0.get_promise();
	}
	tab._CustomViewImpl._createNew = function($p0, $p1, $p2, $p3) {
		var $0 = new tab._CustomViewImpl($p0, $p2['name'], $p1);
		$0.$7 = $p2['isPublic'];
		$0.$6 = $p2['_sessionUrl'];
		var $1 = $p2['owner'];
		$0.$5 = $1['friendlyName'];
		$0.$8 = false;
		if ($p3 != null && $p3 === $p2['id']) {
			$0.$8 = true;
		}
		$0.$1 = $p2;
		return $0;
	}
	tab._CustomViewImpl._saveNewAsync = function($p0, $p1, $p2) {
		var $0 = new tab._Deferred();
		var $1 = {};
		$1['api.customViewName'] = $p2;
		var $2 = tab._CustomViewImpl.$13('api.SaveNewCustomViewCommand', $0, function($p1_0) {
			tab._CustomViewImpl._processCustomViewUpdate($p0, $p1, $p1_0, true);
			var $1_0 = null;
			if (ss.isValue($p0.get_$19())) {
				$1_0 = $p0.get_$19().get_item(0);
			}
			$0.resolve($1_0);
		});
		$p1.sendCommand($1, $2);
		return $0.get_promise();
	}
	tab._CustomViewImpl._showCustomViewAsync = function($p0, $p1, $p2) {
		var $0 = new tab._Deferred();
		var $1 = {};
		if (ss.isValue($p2)) {
			$1['api.customViewParam'] = $p2;
		}
		var $2 = tab._CustomViewImpl.$13('api.ShowCustomViewCommand', $0, function($p1_0) {
			var $1_0 = $p0.get_activeCustomView();
			$0.resolve($1_0);
		});
		$p1.sendCommand($1, $2);
		return $0.get_promise();
	}
	tab._CustomViewImpl._makeCurrentCustomViewDefaultAsync = function($p0, $p1) {
		var $0 = new tab._Deferred();
		var $1 = {};
		var $2 = tab._CustomViewImpl.$13('api.MakeCurrentCustomViewDefaultCommand', $0, function($p1_0) {
			var $1_0 = $p0.get_activeCustomView();
			$0.resolve($1_0);
		});
		$p1.sendCommand($1, $2);
		return $0.get_promise();
	}
	tab._CustomViewImpl._getCustomViewsAsync = function($p0, $p1) {
		var $0 = new tab._Deferred();
		var $1 = new tab._CommandReturnHandler('api.FetchCustomViewsCommand', 0, function($p1_0) {
			var $1_0 = $p1_0;
			tab._CustomViewImpl._processCustomViews($p0, $p1, $1_0);
			$0.resolve($p0.get_$18()._toApiCollection());
		}, function($p1_0, $p1_1) {
			$0.reject(tab._TableauException.create('serverError', $p1_1));
		});
		$p1.sendCommand(null, $1);
		return $0.get_promise();
	}
	tab._CustomViewImpl._processCustomViews = function($p0, $p1, $p2) {
		tab._CustomViewImpl._processCustomViewUpdate($p0, $p1, $p2, false);
	}
	tab._CustomViewImpl._processCustomViewUpdate = function($p0, $p1, $p2, $p3) {
		if ($p3) {
			$p0.set_$19(new tab._Collection());
		}
		$p0.set_$1B(null);
		var $0 = null;
		if (ss.isValue($p2['currentView'])) {
			var $2 = $p2['currentView'];
			$0 = $2['name'];
		}
		var $1 = null;
		if (ss.isValue($p2['defaultId'])) {
			$1 = $p2['defaultId'];
		}
		if ($p3 && ss.isValue($p2['newView'])) {
			var $3 = tab._CustomViewImpl._createNew($p0, $p1, $p2['newView'], $1);
			$p0.get_$19()._add($3.get_$D(), $3.get_$A());
		}
		$p0.set_$1A($p0.get_$18());
		$p0.set_$18(new tab._Collection());
		if (ss.isValue($p2['list'])) {
			var $4 = $p2['list'];
			if ($4.length > 0) {
				for (var $5 = 0; $5 < $4.length; $5++) {
					var $6 = tab._CustomViewImpl._createNew($p0, $p1, $4[$5], $1);
					$p0.get_$18()._add($6.get_$D(), $6.get_$A());
					if ($p0.get_$1A()._has($6.get_$D())) {
						$p0.get_$1A()._remove($6.get_$D());
					} else if ($p3) {
						if (!$p0.get_$19()._has($6.get_$D())) {
							$p0.get_$19()._add($6.get_$D(), $6.get_$A());
						}
					}
					if (ss.isValue($0) && $6.get_$D() === $0) {
						$p0.set_$1B($6.get_$A());
					}
				}
			}
		}
	}
	tab._CustomViewImpl.$13 = function($p0, $p1, $p2) {
		var $0 = function($p1_0, $p1_1) {
			$p1.reject(tab._TableauException.create('serverError', $p1_1));
		};
		return new tab._CommandReturnHandler($p0, 0, $p2, $0);
	}
	tab._CustomViewImpl.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: null,
		$4: null,
		$5: null,
		$6: null,
		$7: false,
		$8: false,
		$9: false,
		get_$A: function() {
			if (this.$0 == null) {
				this.$0 = new tableauSoftware.CustomView(this);
			}
			return this.$0;
		},
		get_$B: function() {
			return this.$2.get_workbook();
		},
		get_$C: function() {
			return this.$6;
		},
		get_$D: function() {
			return this.$4;
		},
		set_$D: function($p0) {
			if (this.$9) {
				throw tab._TableauException.create('staleDataReference', 'Stale data');
			}
			this.$4 = $p0;
			return $p0;
		},
		get_$E: function() {
			return this.$5;
		},
		get_$F: function() {
			return this.$7;
		},
		set_$F: function($p0) {
			if (this.$9) {
				throw tab._TableauException.create('staleDataReference', 'Stale data');
			}
			this.$7 = $p0;
			return $p0;
		},
		get_$10: function() {
			return this.$8;
		},
		$11: function() {
			if (this.$9 || ss.isNullOrUndefined(this.$1)) {
				throw tab._TableauException.create('staleDataReference', 'Stale data');
			}
			this.$1['isPublic'] = this.$7;
			this.$1['isDefault'] = this.$8;
			this.$1['name'] = this.$4;
			var $0 = new tab._Deferred();
			var $1 = {};
			$1['api.customViewParam'] = this.$1;
			var $2 = tab._CustomViewImpl.$13('api.UpdateCustomViewCommand', $0, ss.Delegate.create(this, function($p1_0) {
				tab._CustomViewImpl._processCustomViewUpdate(this.$2, this.$3, $p1_0, true);
				$0.resolve(this.get_$A());
			}));
			this.$3.sendCommand($1, $2);
			return $0.get_promise();
		},
		$12: function() {
			var $0 = new tab._Deferred();
			var $1 = {};
			$1['api.customViewParam'] = this.$1;
			var $2 = tab._CustomViewImpl.$13('api.RemoveCustomViewCommand', $0, ss.Delegate.create(this, function($p1_0) {
				this.$9 = true;
				var $1_0 = $p1_0;
				tab._CustomViewImpl._processCustomViews(this.$2, this.$3, $1_0);
				$0.resolve(this.get_$A());
			}));
			this.$3.sendCommand($1, $2);
			return $0.get_promise();
		},
		_showAsync: function() {
			if (this.$9 || ss.isNullOrUndefined(this.$1)) {
				throw tab._TableauException.create('staleDataReference', 'Stale data');
			}
			return tab._CustomViewImpl._showCustomViewAsync(this.$2, this.$3, this.$1);
		},
		$14: function($p0) {
			return (this.$5 !== $p0.$5 || this.$6 !== $p0.$6 || this.$7 !== $p0.$7 || this.$8 !== $p0.$8);
		}
	}
	tab._DashboardImpl = function(sheetInfoImpl, workbookImpl, messagingOptions) {
		this.$F = new tab._Collection();
		this.$10 = new tab._Collection();
		tab._DashboardImpl.initializeBase(this, [sheetInfoImpl, workbookImpl, messagingOptions]);
	}
	tab._DashboardImpl.prototype = {
		$E: null,
		get_sheet: function() {
			return this.get_dashboard();
		},
		get_dashboard: function() {
			if (this.$E == null) {
				this.$E = new tableauSoftware.Dashboard(this);
			}
			return this.$E;
		},
		get_worksheets: function() {
			return this.$F;
		},
		get_objects: function() {
			return this.$10;
		},
		$11: function($p0, $p1) {
			this.$10 = new tab._Collection();
			this.$F = new tab._Collection();
			for (var $0 = 0; $0 < $p0.length; $0++) {
				var $1 = $p0[$0];
				var $2 = null;
				if ($p0[$0].$0 === 'worksheet') {
					var $4 = $1.$1;
					if (ss.isNullOrUndefined($4)) {
						continue;
					}
					var $5 = this.$F.get__length();
					var $6 = tab.SheetSizeFactory.createAutomatic();
					var $7 = false;
					var $8 = $p1($4);
					var $9 = ss.isNullOrUndefined($8);
					var $A = ($9) ? '' : $8.getUrl();
					var $B = tab.$create__SheetInfoImpl($4, 'worksheet', $5, $6, this.get_workbook(), $A, $7, $9, $1.$4);
					var $C = new tab._WorksheetImpl($B, this.get_workbookImpl(), this.get_messagingOptions(), this);
					$2 = $C.get_worksheet();
					this.$F._add($4, $C.get_worksheet());
				}
				var $3 = new tableauSoftware.DashboardObject($1, this.get_dashboard(), $2);
				this.$10._add($0.toString(), $3);
			}
		}
	}
	tab.JavaScriptApi$3 = function(name, isPrimary) {
		this.$2 = new tab._Collection();
		this.$1 = name;
		this.$3 = isPrimary;
	}
	tab.JavaScriptApi$3.$9 = function($p0) {
		if (ss.isValue($p0) && ss.isValue(tab.JavaScriptApi$3.$0[$p0])) {
			return tab.JavaScriptApi$3.$0[$p0];
		}
		return 'NONE';
	}
	tab.JavaScriptApi$3.$B = function($p0, $p1) {
		var $0 = $p0.worksheetDataSchemaMap[$p1].primaryDatasource;
		var $1 = $p0.parametersDatasource;
		var $2 = new tab._Collection();
		var $3 = null;
		var $4 = $p0.dataSourceList;
		for (var $5 = 0; $5 < $4.length; $5++) {
			var $6 = $4[$5];
			if ($6.datasource === $1) {
				continue;
			}
			var $7 = $6.datasource === $0;
			var $8 = new tab.JavaScriptApi$3($6.datasource, $7);
			if ($7) {
				$3 = $8;
			} else {
				$2._add($6.datasource, $8.get_$5());
			}
			for (var $9 = 0; $9 < $6.fieldList.length; $9++) {
				var $A = $6.fieldList[$9];
				var $B;
				var $C;
				if (ss.isValue($A.baseColumnName)) {
					continue;
				}
				if (ss.isValue($A.columnList)) {
					var $D = $A.columnList;
					for (var $E = 0, $F = $D.length; $E < $F; $E++) {
						var $10 = $D[$E];
						$B = tab.JavaScriptApi$3.$C($10.fieldRole);
						$C = tab.JavaScriptApi$3.$9($10.aggregation);
						var $11 = new tableauSoftware.Field($8.get_$5(), $10.name, $B, $C);
						$8.$A($11);
					}
				} else {
					$B = tab.JavaScriptApi$3.$C($A.defaultFieldRole);
					$C = tab.JavaScriptApi$3.$9($A.defaultAggregation);
					var $12 = new tableauSoftware.Field($8.get_$5(), $A.name, $B, $C);
					$8.$A($12);
				}
			}
		}
		if (ss.isValue($3)) {
			$2._addToFirst($3.get_$6(), $3.get_$5());
		}
		return $2;
	}
	tab.JavaScriptApi$3.$C = function($p0) {
		if (ss.isValue($p0)) {
			if ($p0 === 'dimension') {
				return 'dimension';
			} else if ($p0 === 'measure') {
				return 'measure';
			}
		}
		return 'unknown';
	}
	tab.JavaScriptApi$3.prototype = {
		$1: null,
		$3: false,
		$4: null,
		get_$5: function() {
			if (this.$4 == null) {
				this.$4 = new tableauSoftware.DataSource(this);
			}
			return this.$4;
		},
		get_$6: function() {
			return this.$1;
		},
		get_$7: function() {
			return this.$2;
		},
		get_$8: function() {
			return this.$3;
		},
		$A: function($p0) {
			this.$2._add($p0.getName(), $p0);
		}
	}
	tab._DeferredUtil = function() {}
	tab._DeferredUtil.$0 = function($p0) {
		var $0;
		if ($p0 instanceof tableauSoftware.Promise) {
			$0 = $p0;
		} else {
			if (ss.isValue($p0) && typeof($p0.valueOf) === 'function') {
				$p0 = $p0.valueOf();
			}
			if (tab._DeferredUtil.$4($p0)) {
				var $1 = new tab._DeferredImpl();
				($p0).then(ss.Delegate.create($1, $1.resolve), ss.Delegate.create($1, $1.reject));
				$0 = $1.get_promise();
			} else {
				$0 = tab._DeferredUtil.$2($p0);
			}
		}
		return $0;
	}
	tab._DeferredUtil.$1 = function($p0) {
		return tab._DeferredUtil.$0($p0).then(function($p1_0) {
			return tab._DeferredUtil.$3($p1_0);
		}, null);
	}
	tab._DeferredUtil.$2 = function($p0) {
		var $0 = new tab._PromiseImpl(function($p1_0, $p1_1) {
			try {
				return tab._DeferredUtil.$0((ss.isValue($p1_0)) ? $p1_0($p0) : $p0);
			} catch ($1_0) {
				return tab._DeferredUtil.$3($1_0);
			}
		});
		return $0;
	}
	tab._DeferredUtil.$3 = function($p0) {
		var $0 = new tab._PromiseImpl(function($p1_0, $p1_1) {
			try {
				return (ss.isValue($p1_1)) ? tab._DeferredUtil.$0($p1_1($p0)) : tab._DeferredUtil.$3($p0);
			} catch ($1_0) {
				return tab._DeferredUtil.$3($1_0);
			}
		});
		return $0;
	}
	tab._DeferredUtil.$4 = function($p0) {
		return ss.isValue($p0) && typeof($p0.then) === 'function';
	}
	tab._CollectionImpl = function() {
		this.$0 = [];
		this.$1 = {};
	}
	tab._CollectionImpl.prototype = {
		get__length: function() {
			return this.$0.length;
		},
		get__rawArray: function() {
			return this.$0;
		},
		_get: function($p0) {
			var $0 = this.$4($p0);
			if (ss.isValue(this.$1[$0])) {
				return this.$1[$0];
			}
			return undefined;
		},
		_has: function($p0) {
			return ss.isValue(this._get($p0));
		},
		_add: function($p0, $p1) {
			this.$3($p0, $p1);
			var $0 = this.$4($p0);
			this.$0.push($p1);
			this.$1[$0] = $p1;
		},
		_addToFirst: function($p0, $p1) {
			this.$3($p0, $p1);
			var $0 = this.$4($p0);
			this.$0.unshift($p1);
			this.$1[$0] = $p1;
		},
		_remove: function($p0) {
			var $0 = this.$4($p0);
			if (ss.isValue(this.$1[$0])) {
				var $1 = this.$1[$0];
				delete this.$1[$0];
				for (var $2 = 0; $2 < this.$0.length; $2++) {
					if (this.$0[$2] === $1) {
						this.$0.splice($2, 1);
						break;
					}
				}
			}
		},
		_toApiCollection: function() {
			var $0 = this.$0.concat();
			$0.get = ss.Delegate.create(this, function($p1_0) {
				return this._get($p1_0);
			});
			$0.has = ss.Delegate.create(this, function($p1_0) {
				return this._has($p1_0);
			});
			return $0;
		},
		$2: function($p0) {
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw new Error('Null key');
			}
			if (this._has($p0)) {
				throw new Error("Duplicate key '" + $p0 + "'");
			}
		},
		$3: function($p0, $p1) {
			this.$2($p0);
			if (ss.isNullOrUndefined($p1)) {
				throw new Error('Null item');
			}
		},
		$4: function($p0) {
			return '_' + $p0;
		},
		get_item: function($p0) {
			return this.$0[$p0];
		}
	}
	tab._DeferredImpl = function() {
		this.$2 = [];
		this.$0 = new tab._PromiseImpl(ss.Delegate.create(this, this.then));
		this.$1 = ss.Delegate.create(this, this.$5);
		this.$3 = ss.Delegate.create(this, this.$6);
	}
	tab._DeferredImpl.prototype = {
		$0: null,
		$1: null,
		$3: null,
		get_promise: function() {
			return this.$0;
		},
		$4: function($p0) {
			var $0 = new tab._DeferredImpl();
			var $1 = $p0.length;
			var $2 = $1;
			var $3 = [];
			if (!$1) {
				$0.resolve($3);
				return $0.get_promise();
			}
			var $4 = function($p1_0, $p1_1) {
				var $1_0 = tab._DeferredUtil.$0($p1_0);
				$1_0.then(function($p2_0) {
					$3[$p1_1] = $p2_0;
					$2--;
					if (!$2) {
						$0.resolve($3);
					}
					return null;
				}, function($p2_0) {
					$0.reject($p2_0);
					return null;
				});
			};
			for (var $5 = 0; $5 < $1; $5++) {
				$4($p0[$5], $5);
			}
			return $0.get_promise();
		},
		then: function($p0, $p1) {
			return this.$1($p0, $p1);
		},
		resolve: function($p0) {
			return this.$3($p0);
		},
		reject: function($p0) {
			return this.$3(tab._DeferredUtil.$3($p0));
		},
		$5: function($p0, $p1) {
			var $0 = new tab._DeferredImpl();
			this.$2.push(function($p1_0) {
				$p1_0.then($p0, $p1).then(ss.Delegate.create($0, $0.resolve), ss.Delegate.create($0, $0.reject));
			});
			return $0.get_promise();
		},
		$6: function($p0) {
			var $0 = tab._DeferredUtil.$0($p0);
			this.$1 = $0.then;
			this.$3 = tab._DeferredUtil.$0;
			for (var $1 = 0; $1 < this.$2.length; $1++) {
				var $2 = this.$2[$1];
				$2($0);
			}
			this.$2 = null;
			return $0;
		}
	}
	tab._PromiseImpl = function(thenFunc) {
		this.then = thenFunc;
	}
	tab._PromiseImpl.prototype = {
		then: null,
		always: function($p0) {
			return this.then($p0, $p0);
		},
		otherwise: function($p0) {
			return this.then(null, $p0);
		}
	}
	tab._MarkImpl = function(tupleIdOrPairs) {
		this.$1 = new tab._Collection();
		if (tab._jQueryShim.$12(tupleIdOrPairs)) {
			var $0 = tupleIdOrPairs;
			for (var $1 = 0; $1 < $0.length; $1++) {
				var $2 = $0[$1];
				if (!ss.isValue($2.fieldName)) {
					throw tab._TableauException.createInvalidParameter('pair.fieldName');
				}
				if (!ss.isValue($2.value)) {
					throw tab._TableauException.createInvalidParameter('pair.value');
				}
				var $3 = new tableauSoftware.Pair($2.fieldName, $2.value);
				this.$1._add($3.fieldName, $3);
			}
		} else {
			this.$2 = tupleIdOrPairs;
		}
	}
	tab._MarkImpl.$6 = function($p0) {
		var $0 = new tab._Collection();
		if (ss.isNullOrUndefined($p0) || tab._Utility.isNullOrEmpty($p0.marks)) {
			return $0;
		}
		var $enum1 = ss.IEnumerator.getEnumerator($p0.marks);
		while ($enum1.moveNext()) {
			var $1 = $enum1.current;
			var $2 = $1.tupleId;
			var $3 = new tableauSoftware.Mark($2);
			$0._add($2.toString(), $3);
			var $enum2 = ss.IEnumerator.getEnumerator($1.pairs);
			while ($enum2.moveNext()) {
				var $4 = $enum2.current;
				var $5 = tab._Utility.convertRawValue($4.value, $4.valueDataType);
				var $6 = new tableauSoftware.Pair($4.fieldName, $5);
				$6.formattedValue = $4.formattedValue;
				if (!$3.$0.get_$3()._has($6.fieldName)) {
					$3.$0.$7($6);
				}
			}
		}
		return $0;
	}
	tab._MarkImpl.prototype = {
		$0: null,
		$2: 0,
		get_$3: function() {
			return this.$1;
		},
		get_$4: function() {
			return this.$2;
		},
		get_$5: function() {
			if (this.$0 == null) {
				this.$0 = this.$1._toApiCollection();
			}
			return this.$0;
		},
		$7: function($p0) {
			this.$1._add($p0.fieldName, $p0);
		}
	}
	tab._Param = function() {}
	tab._Param.verifyString = function(argumentValue, argumentName) {
		if (ss.isNullOrUndefined(argumentValue) || !argumentValue.length) {
			throw tab._TableauException.createInternalStringArgumentException(argumentName);
		}
	}
	tab._Param.verifyValue = function(argumentValue, argumentName) {
		if (ss.isNullOrUndefined(argumentValue)) {
			throw tab._TableauException.createInternalNullArgumentException(argumentName);
		}
	}
	tab._ParameterImpl = function(pm) {
		this.$1 = pm.name;
		this.$2 = tab._Utility.getDataValue(pm.currentValue);
		this.$3 = tab._ParameterImpl.$16(pm.dataType);
		this.$4 = tab._ParameterImpl.$14(pm.allowableValuesType);
		if (ss.isValue(pm.allowableValues) && this.$4 === 'list') {
			this.$5 = [];
			var $enum1 = ss.IEnumerator.getEnumerator(pm.allowableValues);
			while ($enum1.moveNext()) {
				var $0 = $enum1.current;
				this.$5.push(tab._Utility.getDataValue($0));
			}
		}
		if (this.$4 === 'range') {
			this.$6 = tab._Utility.getDataValue(pm.minValue);
			this.$7 = tab._Utility.getDataValue(pm.maxValue);
			this.$8 = pm.stepSize;
			if ((this.$3 === 'date' || this.$3 === 'datetime') && ss.isValue(this.$8) && ss.isValue(pm.dateStepPeriod)) {
				this.$9 = tab._ParameterImpl.$15(pm.dateStepPeriod);
			}
		}
	}
	tab._ParameterImpl.$14 = function($p0) {
		switch ($p0) {
			case 'list':
				return 'list';
			case 'range':
				return 'range';
			case 'any':
			default:
				return 'all';
		}
	}
	tab._ParameterImpl.$15 = function($p0) {
		switch ($p0) {
			case 'hour':
				return 'hour';
			case 'second':
				return 'second';
			case 'minute':
				return 'minute';
			case 'day':
				return 'day';
			case 'week':
				return 'week';
			case 'month':
				return 'month';
			case 'quarter':
				return 'quarter';
			case 'year':
			default:
				return 'year';
		}
	}
	tab._ParameterImpl.$16 = function($p0) {
		if ($p0 === 'boolean') {
			return 'boolean';
		}
		switch ($p0) {
			case 'real':
				return 'float';
			case 'integer':
			case 'tuple':
				return 'integer';
			case 'date':
				return 'date';
			case 'datetime':
				return 'datetime';
			case 'cstring':
			default:
				return 'string';
		}
	}
	tab._ParameterImpl.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: null,
		$4: null,
		$5: null,
		$6: null,
		$7: null,
		$8: null,
		$9: null,
		get_$A: function() {
			if (this.$0 == null) {
				this.$0 = new tableauSoftware.Parameter(this);
			}
			return this.$0;
		},
		get_$B: function() {
			return this.$1;
		},
		get_$C: function() {
			return this.$2;
		},
		get_$D: function() {
			return this.$3;
		},
		get_$E: function() {
			return this.$4;
		},
		get_$F: function() {
			return this.$5;
		},
		get_$10: function() {
			return this.$6;
		},
		get_$11: function() {
			return this.$7;
		},
		get_$12: function() {
			return this.$8;
		},
		get_$13: function() {
			return this.$9;
		}
	}
	tab._SheetImpl = function(sheetInfoImpl, workbookImpl, messagingOptions) {
		tab._Param.verifyValue(sheetInfoImpl, 'sheetInfoImpl');
		tab._Param.verifyValue(workbookImpl, 'workbookImpl');
		tab._Param.verifyValue(messagingOptions, 'messagingOptions');
		this.$0 = sheetInfoImpl.name;
		this.$1 = sheetInfoImpl.index;
		this.$2 = sheetInfoImpl.isActive;
		this.$3 = sheetInfoImpl.isHidden;
		this.$4 = sheetInfoImpl.sheetType;
		this.$5 = sheetInfoImpl.size;
		this.$6 = sheetInfoImpl.url;
		this.$7 = workbookImpl;
		this.$8 = messagingOptions;
		this.$A = sheetInfoImpl.zoneId;
	}
	tab._SheetImpl.$B = function($p0) {
		if (ss.isValue($p0)) {
			return tab._Utility.toInt($p0);
		}
		return $p0;
	}
	tab._SheetImpl.$C = function($p0) {
		var $0 = tab._Enums.$6($p0.behavior, 'size.behavior');
		var $1 = $p0.minSize;
		if (ss.isValue($1)) {
			$1 = tab.$create_Size(tab._SheetImpl.$B($p0.minSize.width), tab._SheetImpl.$B($p0.minSize.height));
		}
		var $2 = $p0.maxSize;
		if (ss.isValue($2)) {
			$2 = tab.$create_Size(tab._SheetImpl.$B($p0.maxSize.width), tab._SheetImpl.$B($p0.maxSize.height));
		}
		return tab.$create_SheetSize($0, $1, $2);
	}
	tab._SheetImpl.prototype = {
		$0: null,
		$1: 0,
		$2: false,
		$3: false,
		$4: null,
		$5: null,
		$6: null,
		$7: null,
		$8: null,
		$9: null,
		$A: 0,
		get_name: function() {
			return this.$0;
		},
		get_index: function() {
			return this.$1;
		},
		get_workbookImpl: function() {
			return this.$7;
		},
		get_workbook: function() {
			return this.$7.get_workbook();
		},
		get_url: function() {
			if (this.$3) {
				throw tab._TableauException.createNoUrlForHiddenWorksheet();
			}
			return this.$6;
		},
		get_size: function() {
			return this.$5;
		},
		get_isHidden: function() {
			return this.$3;
		},
		get_isActive: function() {
			return this.$2;
		},
		set_isActive: function(value) {
			this.$2 = value;
			return value;
		},
		get_isDashboard: function() {
			return this.$4 === 'dashboard';
		},
		get_sheetType: function() {
			return this.$4;
		},
		get_parentStoryPoint: function() {
			if (ss.isValue(this.$9)) {
				return this.$9.get_storyPoint();
			}
			return null;
		},
		get_parentStoryPointImpl: function() {
			return this.$9;
		},
		set_parentStoryPointImpl: function(value) {
			if (this.$4 === 'story') {
				throw tab._TableauException.createInternalError('A story cannot be a child of another story.');
			}
			this.$9 = value;
			return value;
		},
		get_zoneId: function() {
			return this.$A;
		},
		get_messagingOptions: function() {
			return this.$8;
		},
		changeSizeAsync: function(newSize) {
			newSize = tab._SheetImpl.$C(newSize);
			if (this.$4 === 'worksheet' && newSize.behavior !== 'automatic') {
				throw tab._TableauException.createInvalidSizeBehaviorOnWorksheet();
			}
			var $0 = new tab._Deferred();
			if (this.$5.behavior === newSize.behavior && newSize.behavior === 'automatic') {
				$0.resolve(newSize);
				return $0.get_promise();
			}
			var $1 = this.$D(newSize);
			var $2 = {};
			$2['api.setSheetSizeName'] = this.$0;
			$2['api.minWidth'] = $1['api.minWidth'];
			$2['api.minHeight'] = $1['api.minHeight'];
			$2['api.maxWidth'] = $1['api.maxWidth'];
			$2['api.maxHeight'] = $1['api.maxHeight'];
			var $3 = new tab._CommandReturnHandler('api.SetSheetSizeCommand', 1, ss.Delegate.create(this, function($p1_0) {
				this.get_workbookImpl()._update(ss.Delegate.create(this, function() {
					var $2_0 = this.get_workbookImpl().get_publishedSheets()._get(this.get_name()).getSize();
					$0.resolve($2_0);
				}));
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($2, $3);
			return $0.get_promise();
		},
		sendCommand: function(commandParameters, returnHandler) {
			this.$8.sendCommand(commandParameters, returnHandler);
		},
		$D: function($p0) {
			var $0 = null;
			if (ss.isNullOrUndefined($p0) || ss.isNullOrUndefined($p0.behavior) || ($p0.behavior !== 'automatic' && ss.isNullOrUndefined($p0.minSize) && ss.isNullOrUndefined($p0.maxSize))) {
				throw tab._TableauException.createInvalidSheetSizeParam();
			}
			var $1 = 0;
			var $2 = 0;
			var $3 = 0;
			var $4 = 0;
			var $5 = {};
			$5['api.minWidth'] = 0;
			$5['api.minHeight'] = 0;
			$5['api.maxWidth'] = 0;
			$5['api.maxHeight'] = 0;
			if ($p0.behavior === 'automatic') {
				$0 = tab.$create_SheetSize('automatic', undefined, undefined);
			} else if ($p0.behavior === 'atmost') {
				if (ss.isNullOrUndefined($p0.maxSize) || ss.isNullOrUndefined($p0.maxSize.width) || ss.isNullOrUndefined($p0.maxSize.height)) {
					throw tab._TableauException.createMissingMaxSize();
				}
				if ($p0.maxSize.width < 0 || $p0.maxSize.height < 0) {
					throw tab._TableauException.createInvalidSizeValue();
				}
				$5['api.maxWidth'] = $p0.maxSize.width;
				$5['api.maxHeight'] = $p0.maxSize.height;
				$0 = tab.$create_SheetSize('atmost', undefined, $p0.maxSize);
			} else if ($p0.behavior === 'atleast') {
				if (ss.isNullOrUndefined($p0.minSize) || ss.isNullOrUndefined($p0.minSize.width) || ss.isNullOrUndefined($p0.minSize.height)) {
					throw tab._TableauException.createMissingMinSize();
				}
				if ($p0.minSize.width < 0 || $p0.minSize.height < 0) {
					throw tab._TableauException.createInvalidSizeValue();
				}
				$5['api.minWidth'] = $p0.minSize.width;
				$5['api.minHeight'] = $p0.minSize.height;
				$0 = tab.$create_SheetSize('atleast', $p0.minSize, undefined);
			} else if ($p0.behavior === 'range') {
				if (ss.isNullOrUndefined($p0.minSize) || ss.isNullOrUndefined($p0.maxSize) || ss.isNullOrUndefined($p0.minSize.width) || ss.isNullOrUndefined($p0.maxSize.width) || ss.isNullOrUndefined($p0.minSize.height) || ss.isNullOrUndefined($p0.maxSize.height)) {
					throw tab._TableauException.createMissingMinMaxSize();
				}
				if ($p0.minSize.width < 0 || $p0.minSize.height < 0 || $p0.maxSize.width < 0 || $p0.maxSize.height < 0 || $p0.minSize.width > $p0.maxSize.width || $p0.minSize.height > $p0.maxSize.height) {
					throw tab._TableauException.createInvalidRangeSize();
				}
				$5['api.minWidth'] = $p0.minSize.width;
				$5['api.minHeight'] = $p0.minSize.height;
				$5['api.maxWidth'] = $p0.maxSize.width;
				$5['api.maxHeight'] = $p0.maxSize.height;
				$0 = tab.$create_SheetSize('range', $p0.minSize, $p0.maxSize);
			} else if ($p0.behavior === 'exactly') {
				if (ss.isValue($p0.minSize) && ss.isValue($p0.maxSize) && ss.isValue($p0.minSize.width) && ss.isValue($p0.maxSize.width) && ss.isValue($p0.minSize.height) && ss.isValue($p0.maxSize.height)) {
					$1 = $p0.minSize.width;
					$2 = $p0.minSize.height;
					$3 = $p0.maxSize.width;
					$4 = $p0.maxSize.height;
					if ($1 !== $3 || $2 !== $4) {
						throw tab._TableauException.createSizeConflictForExactly();
					}
				} else if (ss.isValue($p0.minSize) && ss.isValue($p0.minSize.width) && ss.isValue($p0.minSize.height)) {
					$1 = $p0.minSize.width;
					$2 = $p0.minSize.height;
					$3 = $1;
					$4 = $2;
				} else if (ss.isValue($p0.maxSize) && ss.isValue($p0.maxSize.width) && ss.isValue($p0.maxSize.height)) {
					$3 = $p0.maxSize.width;
					$4 = $p0.maxSize.height;
					$1 = $3;
					$2 = $4;
				}
				$5['api.minWidth'] = $1;
				$5['api.minHeight'] = $2;
				$5['api.maxWidth'] = $3;
				$5['api.maxHeight'] = $4;
				$0 = tab.$create_SheetSize('exactly', tab.$create_Size($1, $2), tab.$create_Size($3, $4));
			}
			this.$5 = $0;
			return $5;
		}
	}
	tab._StoryImpl = function(sheetInfoImpl, workbookImpl, messagingOptions, storyPm, findSheetFunc) {
		tab._StoryImpl.initializeBase(this, [sheetInfoImpl, workbookImpl, messagingOptions]);
		tab._Param.verifyValue(storyPm, 'storyPm');
		tab._Param.verifyValue(findSheetFunc, 'findSheetFunc');
		this.$F = findSheetFunc;
		this.update(storyPm);
	}
	tab._StoryImpl.prototype = {
		$E: null,
		$F: null,
		$10: null,
		$11: null,
		add_activeStoryPointChange: function(value) {
			this.$12 = ss.Delegate.combine(this.$12, value);
		},
		remove_activeStoryPointChange: function(value) {
			this.$12 = ss.Delegate.remove(this.$12, value);
		},
		$12: null,
		get_activeStoryPointImpl: function() {
			return this.$E;
		},
		get_sheet: function() {
			return this.get_story();
		},
		get_story: function() {
			if (this.$10 == null) {
				this.$10 = new tableauSoftware.Story(this);
			}
			return this.$10;
		},
		get_storyPointsInfo: function() {
			return this.$11;
		},
		update: function(storyPm) {
			var $0 = null;
			var $1 = null;
			this.$11 = (this.$11 || new Array(storyPm.storyPoints.length));
			for (var $5 = 0; $5 < storyPm.storyPoints.length; $5++) {
				var $6 = storyPm.storyPoints[$5];
				var $7 = $6.caption;
				var $8 = $5 === storyPm.activeStoryPointIndex;
				var $9 = tab.$create__StoryPointInfoImpl($7, $5, $6.storyPointId, $8, $6.isUpdated, this);
				if (ss.isNullOrUndefined(this.$11[$5])) {
					this.$11[$5] = new tableauSoftware.StoryPointInfo($9);
				} else if (this.$11[$5]._impl.storyPointId === $9.storyPointId) {
					var $A = this.$11[$5]._impl;
					$A.caption = $9.caption;
					$A.index = $9.index;
					$A.isActive = $8;
					$A.isUpdated = $9.isUpdated;
				} else {
					this.$11[$5] = new tableauSoftware.StoryPointInfo($9);
				} if ($8) {
					$0 = $6.containedSheetInfo;
					$1 = $9;
				}
			}
			var $2 = this.$11.length - storyPm.storyPoints.length;
			this.$11.splice(storyPm.storyPoints.length, $2);
			var $3 = ss.isNullOrUndefined(this.$E) || this.$E.get_storyPointId() !== $1.storyPointId;
			if (ss.isValue(this.$E) && $3) {
				this.$E.set_isActive(false);
			}
			var $4 = this.$E;
			if ($3) {
				var $B = tab._StoryPointImpl.createContainedSheet($0, this.get_workbookImpl(), this.get_messagingOptions(), this.$F);
				this.$E = new tab._StoryPointImpl($1, $B);
			} else {
				this.$E.set_isActive($1.isActive);
				this.$E.set_isUpdated($1.isUpdated);
			} if ($3 && ss.isValue($4)) {
				this.$16(this.$11[$4.get_index()], this.$E.get_storyPoint());
			}
		},
		activatePreviousStoryPointAsync: function() {
			return this.$13('api.ActivatePreviousStoryPoint');
		},
		activateNextStoryPointAsync: function() {
			return this.$13('api.ActivateNextStoryPoint');
		},
		activateStoryPointAsync: function(index) {
			var $0 = new tab._Deferred();
			if (index < 0 || index >= this.$11.length) {
				throw tab._TableauException.createIndexOutOfRange(index);
			}
			var $1 = this.get_activeStoryPointImpl();
			var $2 = {};
			$2['api.storyPointIndex'] = index;
			var $3 = new tab._CommandReturnHandler('api.ActivateStoryPoint', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				this.$15($1, $1_0);
				$0.resolve(this.$E.get_storyPoint());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($2, $3);
			return $0.get_promise();
		},
		revertStoryPointAsync: function(index) {
			index = (index || this.$E.get_index());
			if (index < 0 || index >= this.$11.length) {
				throw tab._TableauException.createIndexOutOfRange(index);
			}
			var $0 = new tab._Deferred();
			var $1 = {};
			$1['api.storyPointIndex'] = index;
			var $2 = new tab._CommandReturnHandler('api.RevertStoryPoint', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				this.$14(index, $1_0);
				$0.resolve(this.$11[index]);
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$13: function($p0) {
			if ($p0 !== 'api.ActivatePreviousStoryPoint' && $p0 !== 'api.ActivateNextStoryPoint') {
				throw tab._TableauException.createInternalError("commandName '" + $p0 + "' is invalid.");
			}
			var $0 = new tab._Deferred();
			var $1 = this.get_activeStoryPointImpl();
			var $2 = {};
			var $3 = new tab._CommandReturnHandler($p0, 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				this.$15($1, $1_0);
				$0.resolve(this.$E.get_storyPoint());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($2, $3);
			return $0.get_promise();
		},
		$14: function($p0, $p1) {
			var $0 = this.$11[$p0]._impl;
			if ($0.storyPointId !== $p1.storyPointId) {
				throw tab._TableauException.createInternalError("We should not be updating a story point where the IDs don't match. Existing storyPointID=" + $0.storyPointId + ', newStoryPointID=' + $p1.storyPointId);
			}
			$0.caption = $p1.caption;
			$0.isUpdated = $p1.isUpdated;
			if ($p1.storyPointId === this.$E.get_storyPointId()) {
				this.$E.set_isUpdated($p1.isUpdated);
			}
		},
		$15: function($p0, $p1) {
			var $0 = $p1.index;
			if ($p0.get_index() === $0) {
				return;
			}
			var $1 = this.$11[$p0.get_index()];
			var $2 = this.$11[$0]._impl;
			var $3 = tab._StoryPointImpl.createContainedSheet($p1.containedSheetInfo, this.get_workbookImpl(), this.get_messagingOptions(), this.$F);
			$2.isActive = true;
			this.$E = new tab._StoryPointImpl($2, $3);
			$p0.set_isActive(false);
			$1._impl.isActive = false;
			this.$16($1, this.$E.get_storyPoint());
		},
		$16: function($p0, $p1) {
			if (this.$12 != null) {
				this.$12($p0, $p1);
			}
		}
	}
	tab._StoryPointImpl = function(storyPointInfoImpl, containedSheetImpl) {
		this.$2 = storyPointInfoImpl.isActive;
		this.$3 = storyPointInfoImpl.isUpdated;
		this.$0 = storyPointInfoImpl.caption;
		this.$1 = storyPointInfoImpl.index;
		this.$5 = storyPointInfoImpl.parentStoryImpl;
		this.$7 = storyPointInfoImpl.storyPointId;
		this.$4 = containedSheetImpl;
		if (ss.isValue(containedSheetImpl)) {
			this.$4.set_parentStoryPointImpl(this);
			if (containedSheetImpl.get_sheetType() === 'dashboard') {
				var $0 = this.$4;
				for (var $1 = 0; $1 < $0.get_worksheets().get__length(); $1++) {
					var $2 = $0.get_worksheets().get_item($1);
					$2._impl.set_parentStoryPointImpl(this);
				}
			}
		}
	}
	tab._StoryPointImpl.createContainedSheet = function(containedSheetInfo, workbookImpl, messagingOptions, findSheetFunc) {
		var $0 = tab._WorkbookImpl.$8(containedSheetInfo.sheetType);
		var $1 = -1;
		var $2 = tab.SheetSizeFactory.createAutomatic();
		var $3 = false;
		var $4 = findSheetFunc(containedSheetInfo.name);
		var $5 = ss.isNullOrUndefined($4);
		var $6 = ($5) ? '' : $4.getUrl();
		var $7 = tab.$create__SheetInfoImpl(containedSheetInfo.name, $0, $1, $2, workbookImpl.get_workbook(), $6, $3, $5, containedSheetInfo.zoneId);
		if (containedSheetInfo.sheetType === 'worksheet') {
			var $8 = null;
			var $9 = new tab._WorksheetImpl($7, workbookImpl, messagingOptions, $8);
			return $9;
		} else if (containedSheetInfo.sheetType === 'dashboard') {
			var $A = new tab._DashboardImpl($7, workbookImpl, messagingOptions);
			var $B = tab._WorkbookImpl.$9(containedSheetInfo.dashboardZones);
			$A.$11($B, findSheetFunc);
			return $A;
		} else if (containedSheetInfo.sheetType === 'story') {
			throw tab._TableauException.createInternalError('Cannot have a story embedded within another story.');
		} else {
			throw tab._TableauException.createInternalError("Unknown sheet type '" + containedSheetInfo.sheetType + "'");
		}
	}
	tab._StoryPointImpl.prototype = {
		$0: null,
		$1: 0,
		$2: false,
		$3: false,
		$4: null,
		$5: null,
		$6: null,
		$7: 0,
		get_caption: function() {
			return this.$0;
		},
		get_containedSheetImpl: function() {
			return this.$4;
		},
		get_index: function() {
			return this.$1;
		},
		get_isActive: function() {
			return this.$2;
		},
		set_isActive: function(value) {
			this.$2 = value;
			return value;
		},
		get_isUpdated: function() {
			return this.$3;
		},
		set_isUpdated: function(value) {
			this.$3 = value;
			return value;
		},
		get_parentStoryImpl: function() {
			return this.$5;
		},
		get_storyPoint: function() {
			if (this.$6 == null) {
				this.$6 = new tableauSoftware.StoryPoint(this);
			}
			return this.$6;
		},
		get_storyPointId: function() {
			return this.$7;
		},
		$8: function() {
			return tab.$create__StoryPointInfoImpl(this.$0, this.$1, this.$7, this.$2, this.$3, this.$5);
		}
	}
	tab.StoryPointInfoImplUtil = function() {}
	tab.StoryPointInfoImplUtil.clone = function(impl) {
		return tab.$create__StoryPointInfoImpl(impl.caption, impl.index, impl.storyPointId, impl.isActive, impl.isUpdated, impl.parentStoryImpl);
	}
	tab._TableauException = function() {}
	tab._TableauException.create = function(id, message) {
		var $0 = new Error(message);
		$0.tableauSoftwareErrorCode = id;
		return $0;
	}
	tab._TableauException.createInternalError = function(details) {
		if (ss.isValue(details)) {
			return tab._TableauException.create('internalError', 'Internal error. Please contact Tableau support with the following information: ' + details);
		} else {
			return tab._TableauException.create('internalError', 'Internal error. Please contact Tableau support');
		}
	}
	tab._TableauException.createInternalNullArgumentException = function(argumentName) {
		return tab._TableauException.createInternalError("Null/undefined argument '" + argumentName + "'.");
	}
	tab._TableauException.createInternalStringArgumentException = function(argumentName) {
		return tab._TableauException.createInternalError("Invalid string argument '" + argumentName + "'.");
	}
	tab._TableauException.createServerError = function(message) {
		return tab._TableauException.create('serverError', message);
	}
	tab._TableauException.createNotActiveSheet = function() {
		return tab._TableauException.create('notActiveSheet', 'Operation not allowed on non-active sheet');
	}
	tab._TableauException.createInvalidCustomViewName = function(customViewName) {
		return tab._TableauException.create('invalidCustomViewName', 'Invalid custom view name: ' + customViewName);
	}
	tab._TableauException.createInvalidParameter = function(paramName) {
		return tab._TableauException.create('invalidParameter', 'Invalid parameter: ' + paramName);
	}
	tab._TableauException.createInvalidFilterFieldNameOrValue = function(fieldName) {
		return tab._TableauException.create('invalidFilterFieldNameOrValue', 'Invalid filter field name or value: ' + fieldName);
	}
	tab._TableauException.createInvalidDateParameter = function(paramName) {
		return tab._TableauException.create('invalidDateParameter', 'Invalid date parameter: ' + paramName);
	}
	tab._TableauException.createNullOrEmptyParameter = function(paramName) {
		return tab._TableauException.create('nullOrEmptyParameter', 'Parameter cannot be null or empty: ' + paramName);
	}
	tab._TableauException.createMissingMaxSize = function() {
		return tab._TableauException.create('missingMaxSize', 'Missing maxSize for SheetSizeBehavior.ATMOST');
	}
	tab._TableauException.createMissingMinSize = function() {
		return tab._TableauException.create('missingMinSize', 'Missing minSize for SheetSizeBehavior.ATLEAST');
	}
	tab._TableauException.createMissingMinMaxSize = function() {
		return tab._TableauException.create('missingMinMaxSize', 'Missing minSize or maxSize for SheetSizeBehavior.RANGE');
	}
	tab._TableauException.createInvalidRangeSize = function() {
		return tab._TableauException.create('invalidSize', 'Missing minSize or maxSize for SheetSizeBehavior.RANGE');
	}
	tab._TableauException.createInvalidSizeValue = function() {
		return tab._TableauException.create('invalidSize', 'Size value cannot be less than zero');
	}
	tab._TableauException.createInvalidSheetSizeParam = function() {
		return tab._TableauException.create('invalidSize', 'Invalid sheet size parameter');
	}
	tab._TableauException.createSizeConflictForExactly = function() {
		return tab._TableauException.create('invalidSize', 'Conflicting size values for SheetSizeBehavior.EXACTLY');
	}
	tab._TableauException.createInvalidSizeBehaviorOnWorksheet = function() {
		return tab._TableauException.create('invalidSizeBehaviorOnWorksheet', 'Only SheetSizeBehavior.AUTOMATIC is allowed on Worksheets');
	}
	tab._TableauException.createNoUrlForHiddenWorksheet = function() {
		return tab._TableauException.create('noUrlForHiddenWorksheet', 'Hidden worksheets do not have a URL.');
	}
	tab._TableauException.$0 = function($p0) {
		return tab._TableauException.create('invalidAggregationFieldName', "Invalid aggregation type for field '" + $p0 + "'");
	}
	tab._TableauException.createIndexOutOfRange = function(index) {
		return tab._TableauException.create('indexOutOfRange', "Index '" + index + "' is out of range.");
	}
	tab._TableauException.createUnsupportedEventName = function(eventName) {
		return tab._TableauException.create('unsupportedEventName', "Unsupported event '" + eventName + "'.");
	}
	tab._TableauException.createBrowserNotCapable = function() {
		return tab._TableauException.create('browserNotCapable', 'This browser is incapable of supporting the Tableau JavaScript API.');
	}
	tab._Utility = function() {}
	tab._Utility.hasOwnProperty = function(value, field) {
		return value.hasOwnProperty(field);
	}
	tab._Utility.isNullOrEmpty = function(value) {
		return ss.isNullOrUndefined(value) || (value['length'] || 0) <= 0;
	}
	tab._Utility.isString = function(value) {
		return typeof(value) === 'string';
	}
	tab._Utility.isNumber = function(value) {
		return typeof(value) === 'number';
	}
	tab._Utility.isDate = function(value) {
		if (typeof(value) === 'object' && (value instanceof Date)) {
			return true;
		} else if (Object.prototype.toString.call(value) !== '[object Date]') {
			return false;
		}
		return !isNaN((value).getTime());
	}
	tab._Utility.isDateValid = function(dt) {
		return !isNaN(dt.getTime());
	}
	tab._Utility.indexOf = function(array, searchElement, fromIndex) {
		if (ss.isValue((Array).prototype['indexOf'])) {
			return array.indexOf(searchElement, fromIndex);
		}
		fromIndex = (fromIndex || 0);
		var $0 = array.length;
		if ($0 > 0) {
			for (var $1 = fromIndex; $1 < $0; $1++) {
				if (array[$1] === searchElement) {
					return $1;
				}
			}
		}
		return -1;
	}
	tab._Utility.contains = function(array, searchElement, fromIndex) {
		var $0 = tab._Utility.indexOf(array, searchElement, fromIndex);
		return $0 >= 0;
	}
	tab._Utility.getTopmostWindow = function() {
		var $0 = window.self;
		while (ss.isValue($0.parent) && $0.parent !== $0) {
			$0 = $0.parent;
		}
		return $0;
	}
	tab._Utility.toInt = function(value) {
		if (tab._Utility.isNumber(value)) {
			return value;
		}
		return parseInt(value.toString(), 10);
	}
	tab._Utility.toBoolean = function(value, defaultIfMissing) {
		var $0 = new RegExp('^(yes|y|true|t|1)$', 'i');
		if (tab._Utility.isNullOrEmpty(value)) {
			return defaultIfMissing;
		}
		var $1 = value.match($0);
		return !tab._Utility.isNullOrEmpty($1);
	}
	tab._Utility.hasClass = function(element, className) {
		var $0 = new RegExp('[\\n\\t\\r]', 'g');
		return ss.isValue(element) && (' ' + element.className + ' ').replace($0, ' ').indexOf(' ' + className + ' ') > -1;
	}
	tab._Utility.findParentWithClassName = function(element, className, stopAtElement) {
		var $0 = (ss.isValue(element)) ? element.parentNode : null;
		stopAtElement = (stopAtElement || document.body);
		while ($0 != null) {
			if (tab._Utility.hasClass($0, className)) {
				return $0;
			}
			if ($0 === stopAtElement) {
				$0 = null;
			} else {
				$0 = $0.parentNode;
			}
		}
		return $0;
	}
	tab._Utility.hasJsonParse = function() {
		return ss.isValue(window.JSON) && ss.isValue(window.JSON.parse);
	}
	tab._Utility.hasWindowPostMessage = function() {
		return ss.isValue(window.postMessage);
	}
	tab._Utility.isPostMessageSynchronous = function() {
		if (tab._Utility.isIE()) {
			var $0 = new RegExp('(msie) ([\\w.]+)');
			var $1 = $0.exec(window.navigator.userAgent.toLowerCase());
			var $2 = ($1[2] || '0');
			var $3 = parseInt($2, 10);
			return $3 <= 8;
		}
		return false;
	}
	tab._Utility.hasDocumentAttachEvent = function() {
		return ss.isValue(document.attachEvent);
	}
	tab._Utility.hasWindowAddEventListener = function() {
		return ss.isValue(window.addEventListener);
	}
	tab._Utility.isElementOfTag = function(element, tagName) {
		return ss.isValue(element) && element.nodeType === 1 && element.tagName.toLowerCase() === tagName.toLowerCase();
	}
	tab._Utility.elementToString = function(element) {
		var $0 = new ss.StringBuilder();
		$0.append(element.tagName.toLowerCase());
		if (!tab._Utility.isNullOrEmpty(element.id)) {
			$0.append('#').append(element.id);
		}
		if (!tab._Utility.isNullOrEmpty(element.className)) {
			var $1 = element.className.split(' ');
			$0.append('.').append($1.join('.'));
		}
		return $0.toString();
	}
	tab._Utility.tableauGCS = function(e) {
		if (ss.isValue(window.getComputedStyle)) {
			return window.getComputedStyle(e);
		} else {
			return e.currentStyle;
		}
	}
	tab._Utility.isIE = function() {
		return window.navigator.userAgent.indexOf('MSIE') > -1 && ss.isNullOrUndefined(window.opera);
	}
	tab._Utility.isSafari = function() {
		var $0 = window.navigator.userAgent;
		var $1 = $0.indexOf('WebKit') >= 0;
		var $2 = $0.indexOf('Chrome') >= 0;
		return $0.indexOf('Safari') >= 0 || ($1 && !$2);
	}
	tab._Utility.mobileDetect = function() {
		var $0 = window.navigator.userAgent;
		if ($0.indexOf('iPad') !== -1) {
			return true;
		}
		if ($0.indexOf('Android') !== -1) {
			return true;
		}
		if (($0.indexOf('AppleWebKit') !== -1) && ($0.indexOf('Mobile') !== -1)) {
			return true;
		}
		return false;
	}
	tab._Utility.elementPosition = function(el) {
		var $0 = 0;
		var $1 = 0;
		while (!ss.isNullOrUndefined(el)) {
			$1 += el.offsetTop;
			$0 += el.offsetLeft;
			el = el.offsetParent;
		}
		return tab.$create_Point($0, $1);
	}
	tab._Utility.convertRawValue = function(rawValue, dataType) {
		if (dataType === 'boolean') {
			return rawValue;
		}
		if (ss.isNullOrUndefined(rawValue)) {
			return null;
		}
		switch (dataType) {
			case 'date':
			case 'datetime':
				return new Date(rawValue);
			case 'integer':
			case 'real':
				if (rawValue == null) {
					return Number.NaN;
				}
				return rawValue;
			case 'cstring':
			case 'tuple':
			case 'unknown':
			default:
				return rawValue;
		}
	}
	tab._Utility.getDataValue = function(dv) {
		if (ss.isNullOrUndefined(dv)) {
			return tab.$create_DataValue(null, null, null);
		}
		return tab.$create_DataValue(tab._Utility.convertRawValue(dv.value, dv.type), dv.formattedValue, dv.aliasedValue);
	}
	tab._Utility.serializeDateForServer = function(date) {
		var $0 = '';
		if (ss.isValue(date) && tab._Utility.isDate(date)) {
			var $1 = date.getUTCFullYear();
			var $2 = date.getUTCMonth() + 1;
			var $3 = date.getUTCDate();
			var $4 = date.getUTCHours();
			var $5 = date.getUTCMinutes();
			var $6 = date.getUTCSeconds();
			$0 = $1 + '-' + $2 + '-' + $3 + ' ' + $4 + ':' + $5 + ':' + $6;
		}
		return $0;
	}
	tab.VizImpl = function(messageRouter, viz, parentElement, url, options) {
		if (!tab._Utility.hasWindowPostMessage() || !tab._Utility.hasJsonParse()) {
			throw tab._TableauException.createBrowserNotCapable();
		}
		this.$C = new tab.CrossDomainMessagingOptions(messageRouter, this);
		this.$1 = viz;
		if (ss.isNullOrUndefined(parentElement) || parentElement.nodeType !== 1) {
			parentElement = document.body;
		}
		this.$3 = new tab._VizParameters(parentElement, url, options);
		this.$4 = this.$3.get_url();
		if (ss.isValue(options)) {
			this.$8 = options.onFirstInteractive;
		}
	}
	tab.VizImpl.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: null,
		$4: null,
		$5: null,
		$6: null,
		$7: null,
		$8: null,
		$9: false,
		$A: false,
		$B: false,
		$C: null,
		add_customViewsListLoad: function(value) {
			this.$D = ss.Delegate.combine(this.$D, value);
		},
		remove_customViewsListLoad: function(value) {
			this.$D = ss.Delegate.remove(this.$D, value);
		},
		$D: null,
		add_stateReadyForQuery: function(value) {
			this.$E = ss.Delegate.combine(this.$E, value);
		},
		remove_stateReadyForQuery: function(value) {
			this.$E = ss.Delegate.remove(this.$E, value);
		},
		$E: null,
		add_$F: function($p0) {
			this.$10 = ss.Delegate.combine(this.$10, $p0);
		},
		remove_$F: function($p0) {
			this.$10 = ss.Delegate.remove(this.$10, $p0);
		},
		$10: null,
		add_$11: function($p0) {
			this.$12 = ss.Delegate.combine(this.$12, $p0);
		},
		remove_$11: function($p0) {
			this.$12 = ss.Delegate.remove(this.$12, $p0);
		},
		$12: null,
		add_$13: function($p0) {
			this.$14 = ss.Delegate.combine(this.$14, $p0);
		},
		remove_$13: function($p0) {
			this.$14 = ss.Delegate.remove(this.$14, $p0);
		},
		$14: null,
		add_$15: function($p0) {
			this.$16 = ss.Delegate.combine(this.$16, $p0);
		},
		remove_$15: function($p0) {
			this.$16 = ss.Delegate.remove(this.$16, $p0);
		},
		$16: null,
		add_$17: function($p0) {
			this.$18 = ss.Delegate.combine(this.$18, $p0);
		},
		remove_$17: function($p0) {
			this.$18 = ss.Delegate.remove(this.$18, $p0);
		},
		$18: null,
		add_$19: function($p0) {
			this.$1A = ss.Delegate.combine(this.$1A, $p0);
		},
		remove_$19: function($p0) {
			this.$1A = ss.Delegate.remove(this.$1A, $p0);
		},
		$1A: null,
		add_$1B: function($p0) {
			this.$1C = ss.Delegate.combine(this.$1C, $p0);
		},
		remove_$1B: function($p0) {
			this.$1C = ss.Delegate.remove(this.$1C, $p0);
		},
		$1C: null,
		add_$1D: function($p0) {
			this.$1E = ss.Delegate.combine(this.$1E, $p0);
		},
		remove_$1D: function($p0) {
			this.$1E = ss.Delegate.remove(this.$1E, $p0);
		},
		$1E: null,
		add_$1F: function($p0) {
			this.$20 = ss.Delegate.combine(this.$20, $p0);
		},
		remove_$1F: function($p0) {
			this.$20 = ss.Delegate.remove(this.$20, $p0);
		},
		$20: null,
		get_handlerId: function() {
			return this.$6;
		},
		set_handlerId: function(value) {
			this.$6 = value;
			return value;
		},
		get_iframe: function() {
			return this.$2;
		},
		get_serverRoot: function() {
			return this.$3.serverRoot;
		},
		get_$21: function() {
			return this.$1;
		},
		get_$22: function() {
			return this.$9;
		},
		get_$23: function() {
			return this.$A;
		},
		get_$24: function() {
			return this.$2.style.display === 'none';
		},
		get_$25: function() {
			return this.$3.parentElement;
		},
		get_$26: function() {
			return this.$4;
		},
		get_$27: function() {

			if(this.$7 !== null) {

				return this.$7.get_workbook();	
			} 
		},
		get__workbookImpl: function() {
			return this.$7;
		},
		get_$28: function() {
			return this.$B;
		},
		hideLoadIndicators: function() {
			if (ss.isValue(this.$5)) {
				this.$5.$5();
				this.$5 = null;
				delete this.loadFeedback;
			}
		},
		handleVizLoad: function() {
			this.hideLoadIndicators();
			this.$3B();
			if (ss.isNullOrUndefined(this.$7)) {
				this.$7 = new tab._WorkbookImpl(this, this.$C, ss.Delegate.create(this, function() {
					this.$48();
				}));
			} else {
				this.$7._update(ss.Delegate.create(this, function() {
					this.$48();
				}));
			}
		},
		handleEventNotification: function(eventName, eventParameters) {
			var $0 = new tab.JavaScriptApi$4(eventParameters);
			if (eventName === 'api.VizInteractiveEvent') {
				if (ss.isValue(this.$7) && this.$7.get_name() === $0.get_$3()) {
					this.$48();
				}
				this.$42();
			} else if (eventName === 'api.MarksSelectionChangedEvent') {
				if (this.$10 != null) {
					if (this.$7.get_name() === $0.get_$3()) {
						var $1 = null;
						var $2 = this.$7.get_activeSheetImpl();
						if ($2.get_name() === $0.get_$4()) {
							$1 = $2;
						} else if ($2.get_isDashboard()) {
							var $3 = $2;
							$1 = $3.get_worksheets()._get($0.get_$4())._impl;
						}
						if (ss.isValue($1)) {
							$1.set_selectedMarks(null);
							this.$10(new tab.MarksEvent('marksselection', this.$1, $1));
						}
					}
				}
			} else if (eventName === 'api.FilterChangedEvent') {
				if (this.$12 != null) {
					if (this.$7.get_name() === $0.get_$3()) {
						var $4 = null;
						var $5 = this.$7.get_activeSheetImpl();
						if ($5.get_name() === $0.get_$4()) {
							$4 = $5;
						} else if ($5.get_isDashboard()) {
							var $6 = $5;
							$4 = $6.get_worksheets()._get($0.get_$4())._impl;
						}
						if (ss.isValue($4)) {
							var $7 = JSON.parse($0.get_$5());
							var $8 = $7[0];
							var $9 = $7[1];
							this.$12(new tab.FilterEvent('filterchange', this.$1, $4, $8, $9));
						}
					}
				}
			} else if (eventName === 'api.ParameterChangedEvent') {
				if (this.$14 != null) {
					if (this.$7.get_name() === $0.get_$3()) {
						this.$7.set_$23(null);
						var $A = $0.get_$5();
						this.$3C($A);
					}
				}
			} else if (eventName === 'api.CustomViewsListLoadedEvent') {
				var $B = $0.get_$5();
				var $C = JSON.parse($B);
				if (ss.isNullOrUndefined(this.$7)) {
					this.$7 = new tab._WorkbookImpl(this, this.$C, ss.Delegate.create(this, function() {
						this.$48();
					}));
				}
				if (ss.isValue(this.$7)) {
					tab._CustomViewImpl._processCustomViews(this.$7, this.$C, $C);
				}
				this.$43();
				if (this.$16 != null && !$C['customViewLoaded']) {
					this.$3D(this.$7.get_activeCustomView());
				}
			} else if (eventName === 'api.CustomViewUpdatedEvent') {
				var $D = $0.get_$5();
				var $E = JSON.parse($D);
				if (ss.isNullOrUndefined(this.$7)) {
					this.$7 = new tab._WorkbookImpl(this, this.$C, ss.Delegate.create(this, function() {
						this.$48();
					}));
				}
				if (ss.isValue(this.$7)) {
					tab._CustomViewImpl._processCustomViewUpdate(this.$7, this.$C, $E, true);
				}
				if (this.$18 != null) {
					var $F = this.$7.get_$19()._toApiCollection();
					for (var $10 = 0, $11 = $F.length; $10 < $11; $10++) {
						this.$3E($F[$10]);
					}
				}
			} else if (eventName === 'api.CustomViewRemovedEvent') {
				if (this.$1A != null) {
					var $12 = this.$7.get_$1A()._toApiCollection();
					for (var $13 = 0, $14 = $12.length; $13 < $14; $13++) {
						this.$3F($12[$13]);
					}
				}
			} else if (eventName === 'api.CustomViewSetDefaultEvent') {
				var $15 = $0.get_$5();
				var $16 = JSON.parse($15);
				if (ss.isValue(this.$7)) {
					tab._CustomViewImpl._processCustomViews(this.$7, this.$C, $16);
				}
				if (this.$1C != null) {
					var $17 = this.$7.get_$19()._toApiCollection();
					for (var $18 = 0, $19 = $17.length; $18 < $19; $18++) {
						this.$40($17[$18]);
					}
				}
			} else if (eventName === 'api.TabSwitchEvent') {
				this.$7._update(ss.Delegate.create(this, function() {
					if (ss.isValue(this.$0)) {
						this.$0();
					}
					if (this.$7.get_name() === $0.get_$3()) {
						var $1_0 = $0.get_$4();
						var $1_1 = $0.get_$5();
						this.$41($1_0, $1_1);
					}
					this.$48();
				}));
			} else if (eventName === 'api.StorytellingStateChangedEvent') {
				var $1A = this.$7.get_activeSheetImpl();
				if ($1A.get_sheetType() === 'story') {
					$1A.update(JSON.parse($0.get_$5()));
				}
			}
		},
		addEventListener: function(eventName, handler) {
			var $0 = tab._Enums.$7(eventName);
			if ($0 === 'marksselection') {
				this.add_$F(handler);
			} else if ($0 === 'parametervaluechange') {
				this.add_$13(handler);
			} else if ($0 === 'filterchange') {
				this.add_$11(handler);
			} else if ($0 === 'customviewload') {
				this.add_$15(handler);
			} else if ($0 === 'customviewsave') {
				this.add_$17(handler);
			} else if ($0 === 'customviewremove') {
				this.add_$19(handler);
			} else if ($0 === 'customviewsetdefault') {
				this.add_$1B(handler);
			} else if ($0 === 'tabswitch') {
				this.add_$1D(handler);
			} else if ($0 === 'storypointswitch') {
				this.add_$1F(handler);
			} else {
				throw tab._TableauException.createUnsupportedEventName(eventName);
			}
		},
		removeEventListener: function(eventName, handler) {
			var $0 = tab._Enums.$7(eventName);
			if ($0 === 'marksselection') {
				this.remove_$F(handler);
			} else if ($0 === 'parametervaluechange') {
				this.remove_$13(handler);
			} else if ($0 === 'filterchange') {
				this.remove_$11(handler);
			} else if ($0 === 'customviewload') {
				this.remove_$15(handler);
			} else if ($0 === 'customviewsave') {
				this.remove_$17(handler);
			} else if ($0 === 'customviewremove') {
				this.remove_$19(handler);
			} else if ($0 === 'customviewsetdefault') {
				this.remove_$1B(handler);
			} else if ($0 === 'tabswitch') {
				this.remove_$1D(handler);
			} else if ($0 === 'storypointswitch') {
				this.remove_$1F(handler);
			} else {
				throw tab._TableauException.createUnsupportedEventName(eventName);
			}
		},
		$29: function() {
			var $0 = this.$3.$0;
			if (ss.isValue($0)) {
				$0.innerHTML = '';
				$0.parentNode.removeChild($0);
				this.$3.$0 = $0 = null;
			}
			tab._VizManagerImpl.$3(this.$1);
			this.$C.get_router().unregisterHandler(this);
		},
		$2A: function() {
			this.$2.style.display = 'block';
		},
		$2B: function() {
			this.$2.style.display = 'none';
		},
		$2C: function() {
			this.$47('showExportImageDialog');
		},
		$2D: function($p0) {
			var $0 = this.$44($p0);
			this.$47('showExportDataDialog', $0);
		},
		$2E: function($p0) {
			var $0 = this.$44($p0);
			this.$47('showExportCrosstabDialog', $0);
		},
		$2F: function() {
			this.$47('showExportPDFDialog');
		},
		$30: function() {
			var $0 = new tab._Deferred();
			var $1 = new tab._CommandReturnHandler('api.RevertAllCommand', 1, function($p1_0) {
				$0.resolve();
			}, function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this._sendCommand(null, $1);
			return $0.get_promise();
		},
		$31: function() {
			var $0 = new tab._Deferred();
			var $1 = new tab._CommandReturnHandler('api.RefreshDataCommand', 1, function($p1_0) {
				$0.resolve();
			}, function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this._sendCommand(null, $1);
			return $0.get_promise();
		},
		$32: function() {
			this.$47('showShareDialog');
		},
		$33: function() {
			if (this.get__workbookImpl().get_isDownloadAllowed()) {
				this.$47('showDownloadWorkbookDialog');
			} else {
				throw tab._TableauException.create('downloadWorkbookNotAllowed', 'Download workbook is not allowed');
			}
		},
		$34: function() {
			return this.$45('pauseAutomaticUpdates');
		},
		$35: function() {
			return this.$45('resumeAutomaticUpdates');
		},
		$36: function() {
			return this.$45('toggleAutomaticUpdates');
		},
		$37: function($p0, $p1) {
			this.$3.width = $p0;
			this.$3.height = $p1;
			this.$2.style.width = this.$3.width;
			this.$2.style.height = this.$3.height;
			this.$7._updateActiveSheetAsync();
		},
		$38: function($p0) {
			this.$B = $p0;
		},
		$39: function() {
			return this.$3.$0;
		},
		$3A: function() {
			try {
				tab._VizManagerImpl.$2(this.$1);
			} catch ($0) {
				this.$29();
				throw $0;
			}
			this.$5 = new tab._LoadFeedback();
			this.$5.$3(this.$3);
			this.$2 = this.$4B();
			this.$5.$4();
			this.$2A();
			if (!tab._Utility.hasWindowPostMessage()) {
				if (tab._Utility.isIE()) {
					this.$2.onreadystatechange = this.$4D();
				} else {
					this.$2.onload = this.$4D();
				}
			}
			this.$A = !this.$3.toolbar;
			this.$9 = !this.$3.tabs;
			this.$C.get_router().registerHandler(this);
			this.$46(9999);
		},
		$3B: function() {
			if (!tab._Utility.hasWindowPostMessage() || ss.isNullOrUndefined(this.$2) || !ss.isValue(this.$2.contentWindow)) {
				return;
			}
			var $0 = tab._Utility.elementPosition(this.$2);
			var $1 = [];
			$1.push('vizOffsetResp');
			$1.push($0.x);
			$1.push($0.y);
			this.$2.contentWindow.postMessage($1.join(','), '*');
		},
		_sendCommand: function($p0, $p1) {
			this.$C.sendCommand($p0, $p1);
		},
		$3C: function($p0) {
			if (this.$14 != null) {
				this.$14(new tab.ParameterEvent('parametervaluechange', this.$1, $p0));
			}
		},
		$3D: function($p0) {
			if (this.$16 != null) {
				this.$16(new tab.CustomViewEvent('customviewload', this.$1, (ss.isValue($p0)) ? $p0._impl : null));
			}
		},
		$3E: function($p0) {
			if (this.$18 != null) {
				this.$18(new tab.CustomViewEvent('customviewsave', this.$1, $p0._impl));
			}
		},
		$3F: function($p0) {
			if (this.$1A != null) {
				this.$1A(new tab.CustomViewEvent('customviewremove', this.$1, $p0._impl));
			}
		},
		$40: function($p0) {
			if (this.$1C != null) {
				this.$1C(new tab.CustomViewEvent('customviewsetdefault', this.$1, $p0._impl));
			}
		},
		$41: function($p0, $p1) {
			if (this.$1E != null) {
				this.$1E(new tab.TabSwitchEvent('tabswitch', this.$1, $p0, $p1));
			}
		},
		raiseStoryPointSwitch: function(oldStoryPointInfo, newStoryPoint) {
			if (this.$20 != null) {
				this.$20(new tab.StoryPointSwitchEvent('storypointswitch', this.$1, oldStoryPointInfo, newStoryPoint));
			}
		},
		$42: function() {
			if (this.$E != null) {
				this.$E(this);
			}
		},
		$43: function() {
			if (this.$D != null) {
				this.$D(this);
			}
		},
		$44: function($p0) {
			if (ss.isNullOrUndefined($p0)) {
				return null;
			}
			var $0 = this.$7.$B($p0);
			if (ss.isNullOrUndefined($0)) {
				throw tab._TableauException.createNotActiveSheet();
			}
			return $0.get_name();
		},
		$45: function($p0) {
			if ($p0 !== 'pauseAutomaticUpdates' && $p0 !== 'resumeAutomaticUpdates' && $p0 !== 'toggleAutomaticUpdates') {
				throw tab._TableauException.createInternalError(null);
			}
			var $0 = {};
			$0['api.invokeCommandName'] = $p0;
			var $1 = new tab._Deferred();
			var $2 = new tab._CommandReturnHandler('api.InvokeCommandCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				if (ss.isValue($1_0['isAutoUpdate'])) {
					this.$B = !$1_0['isAutoUpdate'];
				}
				$1.resolve(this.$B);
			}), function($p1_0, $p1_1) {
				$1.reject(tab._TableauException.createServerError($p1_1));
			});
			this._sendCommand($0, $2);
			return $1.get_promise();
		},
		$46: function($p0) {
			var $0 = '&:loadOrderID=' + $p0.toString();
			var $1 = '&:apiID=' + this.$6;
			this.$2.src = this.$4 + $0 + $1;
		},
		$47: function($p0, $p1) {
			if ($p0 !== 'showExportImageDialog' && $p0 !== 'showExportDataDialog' && $p0 !== 'showExportCrosstabDialog' && $p0 !== 'showExportPDFDialog' && $p0 !== 'showShareDialog' && $p0 !== 'showDownloadWorkbookDialog') {
				throw tab._TableauException.createInternalError(null);
			}
			var $0 = {};
			$0['api.invokeCommandName'] = $p0;
			if (ss.isValue($p1)) {
				$0['api.invokeCommandParam'] = $p1;
			}
			var $1 = new tab._CommandReturnHandler('api.InvokeCommandCommand', 0, null, null);
			this._sendCommand($0, $1);
		},
		$48: function() {
			if (ss.isValue(this.$8)) {
				var $0 = this.$8;
				window.setTimeout(ss.Delegate.create(this, function() {
					$0(new tab.TableauEvent('firstinteractive', this.$1));
				}), 0);
				this.$8 = null;
			}
			this.$42();
		},
		$49: function() {
			if (tab._Utility.isIE()) {
				if (this.$2.readyState === 'complete') {
					this.handleVizLoad();
				}
			} else {
				this.handleVizLoad();
			}
		},
		$4A: function() {
			window.setTimeout(ss.Delegate.create(this, this.$49), 3000);
		},
		$4B: function() {
			if (ss.isNullOrUndefined(this.$39())) {
				return null;
			}
			var $0 = document.createElement('IFrame');
			$0.frameBorder = '0';
			$0.setAttribute('allowTransparency', 'true');
			$0.marginHeight = '0';
			$0.marginWidth = '0';
			var $1 = this.$3.width;
			var $2 = this.$3.height;
			if (tab._Utility.isNumber($1)) {
				$1 = $1 + 'px';
			}
			if (tab._Utility.isNumber($2)) {
				$2 = $2 + 'px';
			}
			$0.style.width = $1;
			$0.style.height = $2;
			if (tab._Utility.isSafari()) {
				$0.addEventListener('mousewheel', ss.Delegate.create(this, this.$4C), false);
			}
			this.$39().appendChild($0);
			return $0;
		},
		$4C: function($p0) {},
		$4D: function() {
			return ss.Delegate.create(this, function($p1_0) {
				this.$4A();
			});
		}
	}
	tab._VizManagerImpl = function() {}
	tab._VizManagerImpl.get_$1 = function() {
		return tab._VizManagerImpl.$0.concat();
	}
	tab._VizManagerImpl.$2 = function($p0) {
		tab._VizManagerImpl.$4($p0);
		tab._VizManagerImpl.$0.push($p0);
	}
	tab._VizManagerImpl.$3 = function($p0) {
		for (var $0 = 0, $1 = tab._VizManagerImpl.$0.length; $0 < $1; $0++) {
			if (tab._VizManagerImpl.$0[$0] === $p0) {
				tab._VizManagerImpl.$0.splice($0, 1);
				break;
			}
		}
	}
	tab._VizManagerImpl.$4 = function($p0) {
		var $0 = $p0.getParentElement();
		for (var $1 = 0, $2 = tab._VizManagerImpl.$0.length; $1 < $2; $1++) {
			if (tab._VizManagerImpl.$0[$1].getParentElement() === $0) {
				var $3 = "Another viz is already present in element '" + tab._Utility.elementToString($0) + "'.";
				throw tab._TableauException.create('vizAlreadyInManager', $3);
			}
		}
	}
	tab._VizParameters = function(element, url, options) {
		if (ss.isNullOrUndefined(element) || ss.isNullOrUndefined(url)) {
			throw tab._TableauException.create('noUrlOrParentElementNotFound', 'URL is empty or Parent element not found');
		}
		if (ss.isNullOrUndefined(options)) {
			options = {};
			options.width = '800px';
			options.height = '600px';
			options.hideTabs = false;
			options.hideToolbar = false;
			options.onFirstInteractive = null;
		} else {
			if (ss.isNullOrUndefined(options.width)) {
				options.width = '800px';
			}
			if (ss.isNullOrUndefined(options.height)) {
				options.height = '600px';
			}
		}
		var $0 = new ss.StringBuilder();
		$0.append('<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 0; padding: 0; margin: 0">');
		$0.append('</div>');
		var $1 = document.createElement('div');
		$1.innerHTML = $0.toString();
		this.$0 = $1.firstChild;
		element.appendChild(this.$0);
		$1.innerHTML = '';
		$1 = null;
		this.tabs = !(options.hideTabs || false);
		this.toolbar = !(options.hideToolbar || false);
		this.parentElement = element;
		this.createOptions = options;
		this.width = this.createOptions.width;
		this.height = this.createOptions.height;
		this.toolBarPosition = options.toolbarPosition;
		var $2 = url.split('?');
		this.$1 = $2[0];
		if ($2.length === 2) {
			this.userSuppliedParameters = $2[1];
		} else {
			this.userSuppliedParameters = '';
		}
		var $3 = new RegExp('.*?[^/:]/', '').exec(this.$1);
		if (ss.isNullOrUndefined($3) || ($3[0].toLowerCase().indexOf('http://') === -1 && $3[0].toLowerCase().indexOf('https://') === -1)) {
			throw tab._TableauException.create('invalidUrl', 'Invalid url');
		}
		this.host_url = $3[0].toLowerCase();
		this.name = this.$1.replace($3[0], '');
		this.name = this.name.replace('views/', '');
		this.serverRoot = decodeURIComponent(this.host_url);
	}
	tab._VizParameters.prototype = {
		name: '',
		host_url: null,
		tabs: false,
		toolbar: false,
		toolBarPosition: null,
		width: null,
		height: null,
		serverRoot: null,
		parentElement: null,
		createOptions: null,
		userSuppliedParameters: null,
		$0: null,
		$1: null,
		get_url: function() {
			return this.$2();
		},
		get_baseUrl: function() {
			return this.$1;
		},
		$2: function() {
			var $0 = [];
			$0.push(this.get_baseUrl());
			$0.push('?');
			if (this.userSuppliedParameters.length > 0) {
				$0.push(this.userSuppliedParameters);
				$0.push('&');
			}
			$0.push(':embed=y');
			$0.push('&:showVizHome=no');
			if (!this.tabs) {
				$0.push('&:tabs=n');
			}
			if (!this.toolbar) {
				$0.push('&:toolbar=n');
			} else if (!ss.isNullOrUndefined(this.toolBarPosition)) {
				$0.push('&:toolbar=');
				$0.push(this.toolBarPosition);
			}
			var $1 = this.createOptions;
			var $dict1 = $1;
			for (var $key2 in $dict1) {
				var $2 = {
					key: $key2,
					value: $dict1[$key2]
				};
				if ($2.key !== 'embed' && $2.key !== 'height' && $2.key !== 'width' && $2.key !== 'hideTabs' && $2.key !== 'hideToolbar' && $2.key !== 'onFirstInteractive' && $2.key !== 'toolbarPosition') {
					$0.push('&');
					$0.push(encodeURIComponent($2.key));
					$0.push('=');
					$0.push(encodeURIComponent($2.value.toString()));
				}
			}
			return $0.join('');
		}
	}
	tab._WorkbookImpl = function(vizImpl, messagingOptions, callback) {
		this.$5 = new tab._Collection();
		this.$15 = new tab._Collection();
		this.$16 = new tab._Collection();
		this.$17 = new tab._Collection();
		this.$1 = vizImpl;
		this.$7 = messagingOptions;
		this.$10(callback);
	}
	tab._WorkbookImpl.$8 = function($p0) {
		switch ($p0) {
			case 'dashboard':
				return 'dashboard';
			case 'story':
				return 'story';
			case 'worksheet':
				return 'worksheet';
			default:
				throw tab._TableauException.createInternalError("Unknown sheetType '" + $p0 + "'");
		}
	}
	tab._WorkbookImpl.$9 = function($p0) {
		$p0 = ($p0 || []);
		var $0 = [];
		for (var $1 = 0; $1 < $p0.length; $1++) {
			var $2 = $p0[$1];
			var $3 = $2.zoneType;
			var $4 = 'blank';
			switch ($3) {
				case 'color':
				case 'shape':
				case 'size':
				case 'map':
					$4 = 'legend';
					break;
				case 'layout-basic':
				case 'layout-flow':
					continue;
				case 'filter':
					$4 = 'quickFilter';
					break;
				case 'viz':
					$4 = 'worksheet';
					break;
				case 'paramctrl':
					$4 = 'parameterControl';
					break;
				case 'empty':
					$4 = 'blank';
					break;
				case 'title':
					$4 = 'title';
					break;
				case 'text':
					$4 = 'text';
					break;
				case 'bitmap':
					$4 = 'image';
					break;
				case 'web':
					$4 = 'webPage';
					break;
			}
			var $5 = tab.$create_Size($2.width, $2.height);
			var $6 = tab.$create_Point($2.x, $2.y);
			var $7 = $2.name;
			var $8 = tab.$create_JavaScriptApi$2($7, $4, $6, $5, $2.zoneId);
			$0.push($8);
		}
		return $0;
	}
	tab._WorkbookImpl.$A = function($p0) {
		if (ss.isNullOrUndefined($p0)) {
			return null;
		}
		if (tab._Utility.isString($p0)) {
			return $p0;
		}
		var $0 = $p0;
		var $1 = ss.Delegate.create($0, $0.getName);
		if (ss.isValue($1)) {
			return $1();
		}
		return null;
	}
	tab._WorkbookImpl.$E = function($p0) {
		if (ss.isNullOrUndefined($p0)) {
			return tab.SheetSizeFactory.createAutomatic();
		}
		var $0 = $p0.minHeight;
		var $1 = $p0.minWidth;
		var $2 = $p0.maxHeight;
		var $3 = $p0.maxWidth;
		var $4 = 'automatic';
		var $5 = null;
		var $6 = null;
		if (!$0 && !$1) {
			if (!$2 && !$3) {} else {
				$4 = 'atmost';
				$6 = tab.$create_Size($3, $2);
			}
		} else if (!$2 && !$3) {
			$4 = 'atleast';
			$5 = tab.$create_Size($1, $0);
		} else if ($2 === $0 && $3 === $1) {
			$4 = 'exactly';
			$5 = tab.$create_Size($1, $0);
			$6 = tab.$create_Size($1, $0);
		} else {
			$4 = 'range';
			$5 = tab.$create_Size($1, $0);
			$6 = tab.$create_Size($3, $2);
		}
		return tab.$create_SheetSize($4, $5, $6);
	}
	tab._WorkbookImpl.$28 = function($p0) {
		var $0 = new tab._Collection();
		var $enum1 = ss.IEnumerator.getEnumerator($p0.parameters);
		while ($enum1.moveNext()) {
			var $1 = $enum1.current;
			var $2 = new tab._ParameterImpl($1);
			$0._add($2.get_$B(), $2.get_$A());
		}
		return $0;
	}
	tab._WorkbookImpl.$29 = function($p0, $p1) {
		var $enum1 = ss.IEnumerator.getEnumerator($p1.parameters);
		while ($enum1.moveNext()) {
			var $0 = $enum1.current;
			if ($0.name === $p0) {
				return new tab._ParameterImpl($0);
			}
		}
		return null;
	}
	tab._WorkbookImpl.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: null,
		$4: null,
		$6: false,
		$7: null,
		get_workbook: function() {
			if (ss.isNullOrUndefined(this.$0)) {
				this.$0 = new tableauSoftware.Workbook(this);
			}
			return this.$0;
		},
		get_viz: function() {
			return this.$1.get_$21();
		},
		get_publishedSheets: function() {
			return this.$5;
		},
		get_name: function() {
			return this.$2;
		},
		get_activeSheetImpl: function() {
			return this.$3;
		},
		get_activeCustomView: function() {
			return this.$14;
		},
		get_isDownloadAllowed: function() {
			return this.$6;
		},
		$B: function($p0) {
			if (ss.isNullOrUndefined(this.$3)) {
				return null;
			}
			var $0 = tab._WorkbookImpl.$A($p0);
			if (ss.isNullOrUndefined($0)) {
				return null;
			}
			if ($0 === this.$3.get_name()) {
				return this.$3;
			}
			if (this.$3.get_isDashboard()) {
				var $1 = this.$3;
				var $2 = $1.get_worksheets()._get($0);
				if (ss.isValue($2)) {
					return $2._impl;
				}
			}
			return null;
		},
		_setActiveSheetAsync: function($p0) {
			if (tab._Utility.isNumber($p0)) {
				var $2 = $p0;
				if ($2 < this.$5.get__length() && $2 >= 0) {
					return this.$C(this.$5.get_item($2).$0);
				} else {
					throw tab._TableauException.createIndexOutOfRange($2);
				}
			}
			var $0 = tab._WorkbookImpl.$A($p0);
			var $1 = this.$5._get($0);
			if (ss.isValue($1)) {
				return this.$C($1.$0);
			} else if (this.$3.get_isDashboard()) {
				var $3 = this.$3;
				var $4 = $3.get_worksheets()._get($0);
				if (ss.isValue($4)) {
					this.$4 = null;
					var $5 = '';
					if ($4.getIsHidden()) {
						this.$4 = $4._impl;
					} else {
						$5 = $4._impl.get_url();
					}
					return this.$D($4._impl.get_name(), $5);
				}
			}
			throw tab._TableauException.create('sheetNotInWorkbook', 'Sheet is not found in Workbook');
		},
		_revertAllAsync: function() {
			var $0 = new tab._Deferred();
			var $1 = new tab._CommandReturnHandler('api.RevertAllCommand', 1, function($p1_0) {
				$0.resolve();
			}, function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.$F(null, $1);
			return $0.get_promise();
		},
		_update: function($p0) {
			this.$10($p0);
		},
		$C: function($p0) {
			return this.$D($p0.name, $p0.url);
		},
		$D: function($p0, $p1) {
			var $0 = new tab._Deferred();
			if (ss.isValue(this.$3) && $p0 === this.$3.get_name()) {
				$0.resolve(this.$3.get_sheet());
				return $0.get_promise();
			}
			var $1 = {};
			$1['api.switchToSheetName'] = $p0;
			$1['api.switchToRepositoryUrl'] = $p1;
			$1['api.oldRepositoryUrl'] = this.$3.get_url();
			var $2 = new tab._CommandReturnHandler('api.SwitchActiveSheetCommand', 0, ss.Delegate.create(this, function($p1_0) {
				this.$1.$0 = ss.Delegate.create(this, function() {
					this.$1.$0 = null;
					$0.resolve(this.$3.get_sheet());
				});
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.$F($1, $2);
			return $0.get_promise();
		},
		_updateActiveSheetAsync: function() {
			var $0 = new tab._Deferred();
			var $1 = {};
			$1['api.switchToSheetName'] = this.$3.get_name();
			$1['api.switchToRepositoryUrl'] = this.$3.get_url();
			$1['api.oldRepositoryUrl'] = this.$3.get_url();
			var $2 = new tab._CommandReturnHandler('api.UpdateActiveSheetCommand', 0, ss.Delegate.create(this, function($p1_0) {
				$0.resolve(this.$3.get_sheet());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.$F($1, $2);
			return $0.get_promise();
		},
		$F: function($p0, $p1) {
			this.$7.sendCommand($p0, $p1);
		},
		$10: function($p0) {
			var $0 = new tab._CommandReturnHandler('api.GetClientInfoCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				this.$11($1_0);
				if (ss.isValue($p0)) {
					$p0();
				}
			}), null);
			this.$F(null, $0);
		},
		$11: function($p0) {
			this.$2 = $p0.workbookName;
			this.$6 = $p0.isDownloadAllowed;
			this.$1.$38(!$p0.isAutoUpdate);
			this.$13($p0);
			this.$12($p0);
		},
		$12: function($p0) {
			var $0 = $p0.currentSheetName;
			var $1 = this.$5._get($0);
			if (ss.isNullOrUndefined($1) && ss.isNullOrUndefined(this.$4)) {
				throw tab._TableauException.createInternalError('The active sheet was not specified in baseSheets');
			}
			if (ss.isValue(this.$3) && this.$3.get_name() === $0) {
				return;
			}
			if (ss.isValue(this.$3)) {
				this.$3.set_isActive(false);
				var $2 = this.$5._get(this.$3.get_name());
				if (ss.isValue($2)) {
					$2.$0.isActive = false;
				}
				if (this.$3.get_sheetType() === 'story') {
					var $3 = this.$3;
					$3.remove_activeStoryPointChange(ss.Delegate.create(this.$1, this.$1.raiseStoryPointSwitch));
				}
			}
			if (ss.isValue(this.$4)) {
				var $4 = tab.$create__SheetInfoImpl(this.$4.get_name(), 'worksheet', -1, this.$4.get_size(), this.get_workbook(), '', true, true, 4294967295);
				this.$4 = null;
				this.$3 = new tab._WorksheetImpl($4, this, this.$7, null);
			} else {
				var $5 = null;
				for (var $7 = 0, $8 = $p0.publishedSheets.length; $7 < $8; $7++) {
					if ($p0.publishedSheets[$7].name === $0) {
						$5 = $p0.publishedSheets[$7];
						break;
					}
				}
				if (ss.isNullOrUndefined($5)) {
					throw tab._TableauException.createInternalError('No base sheet was found corresponding to the active sheet.');
				}
				var $6 = ss.Delegate.create(this, function($p1_0) {
					return this.$5._get($p1_0);
				});
				if ($5.sheetType === 'dashboard') {
					var $9 = new tab._DashboardImpl($1.$0, this, this.$7);
					this.$3 = $9;
					var $A = tab._WorkbookImpl.$9($p0.dashboardZones);
					$9.$11($A, $6);
				} else if ($5.sheetType === 'story') {
					var $B = new tab._StoryImpl($1.$0, this, this.$7, $p0.story, $6);
					this.$3 = $B;
					$B.add_activeStoryPointChange(ss.Delegate.create(this.$1, this.$1.raiseStoryPointSwitch));
				} else {
					this.$3 = new tab._WorksheetImpl($1.$0, this, this.$7, null);
				}
				$1.$0.isActive = true;
			}
			this.$3.set_isActive(true);
		},
		$13: function($p0) {
			var $0 = $p0.publishedSheets;
			if (ss.isNullOrUndefined($0)) {
				return;
			}
			for (var $1 = 0; $1 < $0.length; $1++) {
				var $2 = $0[$1];
				var $3 = $2.name;
				var $4 = this.$5._get($3);
				var $5 = tab._WorkbookImpl.$E($2);
				if (ss.isNullOrUndefined($4)) {
					var $6 = $3 === $p0.currentSheetName;
					var $7 = tab._WorkbookImpl.$8($2.sheetType);
					var $8 = tab.$create__SheetInfoImpl($3, $7, $1, $5, this.get_workbook(), $2.repositoryUrl, $6, false, 4294967295);
					$4 = new tableauSoftware.SheetInfo($8);
					this.$5._add($3, $4);
				} else {
					$4.$0.size = $5;
				}
			}
		},
		$14: null,
		get_$18: function() {
			return this.$15;
		},
		set_$18: function($p0) {
			this.$15 = $p0;
			return $p0;
		},
		get_$19: function() {
			return this.$16;
		},
		set_$19: function($p0) {
			this.$16 = $p0;
			return $p0;
		},
		get_$1A: function() {
			return this.$17;
		},
		set_$1A: function($p0) {
			this.$17 = $p0;
			return $p0;
		},
		get_$1B: function() {
			return this.$14;
		},
		set_$1B: function($p0) {
			this.$14 = $p0;
			return $p0;
		},
		$1C: function() {
			return tab._CustomViewImpl._getCustomViewsAsync(this, this.$7);
		},
		$1D: function($p0) {
			if (ss.isNullOrUndefined($p0) || tab._Utility.isNullOrEmpty($p0)) {
				return tab._CustomViewImpl._showCustomViewAsync(this, this.$7, null);
			} else {
				var $0 = this.$15._get($p0);
				if (ss.isNullOrUndefined($0)) {
					var $1 = new tab._Deferred();
					$1.reject(tab._TableauException.createInvalidCustomViewName($p0));
					return $1.get_promise();
				}
				return $0._impl._showAsync();
			}
		},
		$1E: function($p0) {
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw tab._TableauException.createNullOrEmptyParameter('customViewName');
			}
			var $0 = this.$15._get($p0);
			if (ss.isNullOrUndefined($0)) {
				var $1 = new tab._Deferred();
				$1.reject(tab._TableauException.createInvalidCustomViewName($p0));
				return $1.get_promise();
			}
			return $0._impl.$12();
		},
		$1F: function($p0) {
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw tab._TableauException.createInvalidParameter('customViewName');
			}
			return tab._CustomViewImpl._saveNewAsync(this, this.$7, $p0);
		},
		$20: function() {
			return tab._CustomViewImpl._makeCurrentCustomViewDefaultAsync(this, this.$7);
		},
		$21: null,
		$22: null,
		get_$23: function() {
			return this.$22;
		},
		set_$23: function($p0) {
			this.$22 = $p0;
			return $p0;
		},
		get_$24: function() {
			return this.$21;
		},
		$25: function($p0) {
			var $0 = new tab._Deferred();
			if (ss.isValue(this.$22)) {
				$0.resolve(this.$22.get_$A());
				return $0.get_promise();
			}
			var $1 = {};
			var $2 = new tab._CommandReturnHandler('api.FetchParametersCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				var $1_1 = tab._WorkbookImpl.$29($p0, $1_0);
				this.$22 = $1_1;
				$0.resolve($1_1.get_$A());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.$F($1, $2);
			return $0.get_promise();
		},
		$26: function() {
			var $0 = new tab._Deferred();
			var $1 = {};
			var $2 = new tab._CommandReturnHandler('api.FetchParametersCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				this.$21 = tab._WorkbookImpl.$28($1_0);
				$0.resolve(this.get_$24()._toApiCollection());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.$F($1, $2);
			return $0.get_promise();
		},
		$27: function($p0, $p1) {
			var $0 = new tab._Deferred();
			var $1 = null;
			if (ss.isValue(this.$21)) {
				if (ss.isNullOrUndefined(this.$21._get($p0))) {
					$0.reject(tab._TableauException.createInvalidParameter($p0));
					return $0.get_promise();
				}
				$1 = this.$21._get($p0)._impl;
				if (ss.isNullOrUndefined($1)) {
					$0.reject(tab._TableauException.createInvalidParameter($p0));
					return $0.get_promise();
				}
			}
			var $2 = {};
			$2['api.setParameterName'] = (ss.isValue(this.$21)) ? $1.get_$B() : $p0;
			if (ss.isValue($p1) && tab._Utility.isDate($p1)) {
				var $4 = $p1;
				var $5 = tab._Utility.serializeDateForServer($4);
				$2['api.setParameterValue'] = $5;
			} else {
				$2['api.setParameterValue'] = (ss.isValue($p1)) ? $p1.toString() : null;
			}
			this.$22 = null;
			var $3 = new tab._CommandReturnHandler('api.SetParameterValueCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				if (ss.isNullOrUndefined($1_0)) {
					$0.reject(tab._TableauException.create('serverError', 'server error'));
					return;
				}
				if (!$1_0.isValidPresModel) {
					$0.reject(tab._TableauException.createInvalidParameter($p0));
					return;
				}
				var $1_1 = new tab._ParameterImpl($1_0);
				this.$22 = $1_1;
				$0.resolve($1_1.get_$A());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createInvalidParameter($p0));
			});
			this.$F($2, $3);
			return $0.get_promise();
		}
	}
	tab._WorksheetImpl = function(sheetInfoImpl, workbookImpl, messagingOptions, parentDashboardImpl) {
		this.$F = new tab._Collection();
		this.$15 = new tab._Collection();
		this.$27 = new tab._Collection();
		tab._WorksheetImpl.initializeBase(this, [sheetInfoImpl, workbookImpl, messagingOptions]);
		this.$10 = parentDashboardImpl;
	}
	tab._WorksheetImpl.$16 = function($p0) {
		if (ss.isValue($p0['invalidFieldCaption'])) {
			return tab._TableauException.create('invalidFilterFieldName', $p0['invalidFieldCaption']);
		} else if (ss.isValue($p0['invalidValues'])) {
			return tab._TableauException.create('invalidFilterFieldValue', $p0['invalidValues']);
		} else if (ss.isValue($p0['invalidAggFieldName'])) {
			var $0 = $p0['fieldCaption'];
			return tab._TableauException.$0($0);
		}
		return null;
	}
	tab._WorksheetImpl.$1E = function($p0) {
		if (ss.isNullOrUndefined($p0)) {
			throw tab._TableauException.createNullOrEmptyParameter('filterOptions');
		}
		if (ss.isNullOrUndefined($p0.min) && ss.isNullOrUndefined($p0.max)) {
			throw tab._TableauException.create('invalidParameter', 'At least one of filterOptions.min or filterOptions.max must be specified.');
		}
		var $0 = {};
		if (ss.isValue($p0.min)) {
			$0.min = $p0.min;
		}
		if (ss.isValue($p0.max)) {
			$0.max = $p0.max;
		}
		if (ss.isValue($p0.nullOption)) {
			$0.nullOption = tab._Enums.$5($p0.nullOption, 'filterOptions.nullOption');
		}
		return $0;
	}
	tab._WorksheetImpl.$1F = function($p0) {
		if (ss.isNullOrUndefined($p0)) {
			throw tab._TableauException.createNullOrEmptyParameter('filterOptions');
		}
		var $0 = {};
		$0.rangeType = tab._Enums.$1($p0.rangeType, 'filterOptions.rangeType');
		$0.periodType = tab._Enums.$0($p0.periodType, 'filterOptions.periodType');
		if ($0.rangeType === 'lastn' || $0.rangeType === 'nextn') {
			if (ss.isNullOrUndefined($p0.rangeN)) {
				throw tab._TableauException.create('missingRangeNForRelativeDateFilters', 'Missing rangeN field for a relative date filter of LASTN or NEXTN.');
			}
			$0.rangeN = tab._Utility.toInt($p0.rangeN);
		}
		if (ss.isValue($p0.anchorDate)) {
			if (!tab._Utility.isDate($p0.anchorDate) || !tab._Utility.isDateValid($p0.anchorDate)) {
				throw tab._TableauException.createInvalidDateParameter('filterOptions.anchorDate');
			}
			$0.anchorDate = $p0.anchorDate;
		}
		return $0;
	}
	tab._WorksheetImpl.$20 = function($p0, $p1, $p2) {
		return new tab._CommandReturnHandler($p0, 1, function($p1_0) {
			var $1_0 = tab._WorksheetImpl.$16($p1_0);
			if ($1_0 == null) {
				$p2.resolve($p1);
			} else {
				$p2.reject($1_0);
			}
		}, function($p1_0, $p1_1) {
			if ($p1_0) {
				$p2.reject(tab._TableauException.createInvalidFilterFieldNameOrValue($p1));
			} else {
				var $1_0 = tab._TableauException.create('filterCannotBePerformed', $p1_1);
				$p2.reject($1_0);
			}
		});
	}
	tab._WorksheetImpl.$2B = function($p0) {
		if (ss.isValue($p0['invalidFields'])) {
			return tab._TableauException.create('invalidSelectionFieldName', $p0['invalidFields']);
		} else if (ss.isValue($p0['invalidValues'])) {
			return tab._TableauException.create('invalidSelectionValue', $p0['invalidValues']);
		} else if (ss.isValue($p0['invalidDates'])) {
			return tab._TableauException.create('invalidSelectionDate', $p0['invalidDates']);
		}
		return null;
	}
	tab._WorksheetImpl.prototype = {
		$E: null,
		$10: null,
		get__dataSources: function() {
			return this.$F;
		},
		set__dataSources: function(value) {
			this.$F = value;
			return value;
		},
		get_sheet: function() {
			return this.get_worksheet();
		},
		get_worksheet: function() {
			if (this.$E == null) {
				this.$E = new tableauSoftware.Worksheet(this);
			}
			return this.$E;
		},
		get_parentDashboardImpl: function() {
			return this.$10;
		},
		get_parentDashboard: function() {
			if (ss.isValue(this.$10)) {
				return this.$10.get_dashboard();
			}
			return null;
		},
		$11: function() {
			this.$13();
			var $0 = new tab._Deferred();
			var $1 = {};
			var $2 = new tab._CommandReturnHandler('api.GetDataSourcesCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				var $1_1 = tab.JavaScriptApi$3.$B($1_0, this.get_name());
				this.set__dataSources($1_1);
				$0.resolve($1_1._toApiCollection());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$12: function($p0) {
			this.$13();
			var $0 = new tab._Deferred();
			var $1 = {};
			var $2 = new tab._CommandReturnHandler('api.GetDataSourcesCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				var $1_1 = tab.JavaScriptApi$3.$B($1_0, this.get_name());
				this.set__dataSources($1_1);
				for (var $1_2 = 0; $1_2 < $1_1.get__length(); $1_2++) {
					var $1_3 = $1_1.get_item($1_2);
					if ($1_3.getName() === $p0) {
						$0.resolve($1_3);
					}
				}
				$0.reject(tab._TableauException.create('serverError', 'datasource not found'));
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$13: function() {
			var $0 = this.get_isActive();
			var $1 = ss.isValue(this.$10) && this.$10.get_isActive();
			var $2 = ss.isValue(this.get_parentStoryPointImpl()) && this.get_parentStoryPointImpl().get_parentStoryImpl().get_isActive();
			if (!$0 && !$1 && !$2) {
				throw tab._TableauException.createNotActiveSheet();
			}
		},
		$14: function($p0) {
			if (ss.isValue(this.get_parentStoryPointImpl())) {
				var $0 = {};
				$0.worksheet = this.get_name();
				if (ss.isValue(this.get_parentDashboardImpl())) {
					$0.dashboard = this.get_parentDashboardImpl().get_name();
				}
				$0.flipboardZoneId = this.get_parentStoryPointImpl().get_containedSheetImpl().get_zoneId();
				$0.storyboard = this.get_parentStoryPointImpl().get_parentStoryImpl().get_name();
				$0.storyPointId = this.get_parentStoryPointImpl().get_storyPointId();
				$p0['api.visualId'] = $0;
			} else {
				$p0['api.worksheetName'] = this.get_name();
				if (ss.isValue(this.get_parentDashboardImpl())) {
					$p0['api.dashboardName'] = this.get_parentDashboardImpl().get_name();
				}
			}
		},
		get__filters: function() {
			return this.$15;
		},
		set__filters: function(value) {
			this.$15 = value;
			return value;
		},
		$17: function($p0, $p1, $p2) {
			if (!tab._Utility.isNullOrEmpty($p0) && !tab._Utility.isNullOrEmpty($p1)) {
				throw tab._TableauException.createInternalError('Only fieldName OR fieldCaption is allowed, not both.');
			}
			$p2 = ($p2 || {});
			var $0 = new tab._Deferred();
			var $1 = {};
			this.$14($1);
			if (!tab._Utility.isNullOrEmpty($p1) && tab._Utility.isNullOrEmpty($p0)) {
				$1['api.fieldCaption'] = $p1;
			}
			if (!tab._Utility.isNullOrEmpty($p0)) {
				$1['api.fieldName'] = $p0;
			}
			$1['api.filterHierarchicalLevels'] = 0;
			$1['api.ignoreDomain'] = ($p2.ignoreDomain || false);
			var $2 = new tab._CommandReturnHandler('api.GetOneFilterInfoCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = tab._WorksheetImpl.$16($p1_0);
				if ($1_0 == null) {
					var $1_1 = $p1_0;
					var $1_2 = tableauSoftware.Filter.$7(this, $1_1);
					$0.resolve($1_2);
				} else {
					$0.reject($1_0);
				}
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$18: function($p0) {
			this.$13();
			$p0 = ($p0 || {});
			var $0 = new tab._Deferred();
			var $1 = {};
			this.$14($1);
			$1['api.ignoreDomain'] = ($p0.ignoreDomain || false);
			var $2 = new tab._CommandReturnHandler('api.GetFiltersListCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				this.set__filters(tableauSoftware.Filter.$8(this, $1_0));
				$0.resolve(this.get__filters()._toApiCollection());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$19: function($p0, $p1, $p2, $p3) {
			return this.$22($p0, $p1, $p2, $p3);
		},
		$1A: function($p0) {
			return this.$21($p0);
		},
		$1B: function($p0, $p1) {
			var $0 = tab._WorksheetImpl.$1E($p1);
			return this.$23($p0, $0);
		},
		$1C: function($p0, $p1) {
			var $0 = tab._WorksheetImpl.$1F($p1);
			return this.$24($p0, $0);
		},
		$1D: function($p0, $p1, $p2, $p3) {
			if (ss.isNullOrUndefined($p1) && $p2 !== 'all') {
				throw tab._TableauException.createInvalidParameter('values');
			}
			return this.$25($p0, $p1, $p2, $p3);
		},
		$21: function($p0) {
			this.$13();
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw tab._TableauException.createNullOrEmptyParameter('fieldName');
			}
			var $0 = new tab._Deferred();
			var $1 = {};
			$1['api.fieldCaption'] = $p0;
			this.$14($1);
			var $2 = tab._WorksheetImpl.$20('api.ClearFilterCommand', $p0, $0);
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$22: function($p0, $p1, $p2, $p3) {
			this.$13();
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw tab._TableauException.createNullOrEmptyParameter('fieldName');
			}
			$p2 = tab._Enums.$2($p2, 'updateType');
			var $0 = [];
			if (tab._jQueryShim.$12($p1)) {
				for (var $4 = 0; $4 < $p1.length; $4++) {
					$0.push($p1[$4].toString());
				}
			} else if (ss.isValue($p1)) {
				$0.push($p1.toString());
			}
			var $1 = new tab._Deferred();
			var $2 = {};
			$2['api.fieldCaption'] = $p0;
			$2['api.filterUpdateType'] = $p2;
			$2['api.exclude'] = (ss.isValue($p3) && $p3.isExcludeMode) ? true : false;
			if ($p2 !== 'all') {
				$2['api.filterCategoricalValues'] = $0;
			}
			this.$14($2);
			var $3 = tab._WorksheetImpl.$20('api.ApplyCategoricalFilterCommand', $p0, $1);
			this.sendCommand($2, $3);
			return $1.get_promise();
		},
		$23: function($p0, $p1) {
			this.$13();
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw tab._TableauException.createNullOrEmptyParameter('fieldName');
			}
			if (ss.isNullOrUndefined($p1)) {
				throw tab._TableauException.createNullOrEmptyParameter('filterOptions');
			}
			var $0 = {};
			$0['api.fieldCaption'] = $p0;
			if (ss.isValue($p1.min)) {
				if (tab._Utility.isDate($p1.min)) {
					var $3 = $p1.min;
					if (tab._Utility.isDateValid($3)) {
						$0['api.filterRangeMin'] = tab._Utility.serializeDateForServer($3);
					} else {
						throw tab._TableauException.createInvalidDateParameter('filterOptions.min');
					}
				} else {
					$0['api.filterRangeMin'] = $p1.min;
				}
			}
			if (ss.isValue($p1.max)) {
				if (tab._Utility.isDate($p1.max)) {
					var $4 = $p1.max;
					if (tab._Utility.isDateValid($4)) {
						$0['api.filterRangeMax'] = tab._Utility.serializeDateForServer($4);
					} else {
						throw tab._TableauException.createInvalidDateParameter('filterOptions.max');
					}
				} else {
					$0['api.filterRangeMax'] = $p1.max;
				}
			}
			if (ss.isValue($p1.nullOption)) {
				$0['api.filterRangeNullOption'] = $p1.nullOption;
			}
			this.$14($0);
			var $1 = new tab._Deferred();
			var $2 = tab._WorksheetImpl.$20('api.ApplyRangeFilterCommand', $p0, $1);
			this.sendCommand($0, $2);
			return $1.get_promise();
		},
		$24: function($p0, $p1) {
			this.$13();
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw tab._TableauException.createInvalidParameter('fieldName');
			} else if (ss.isNullOrUndefined($p1)) {
				throw tab._TableauException.createInvalidParameter('filterOptions');
			}
			var $0 = {};
			$0['api.fieldCaption'] = $p0;
			if (ss.isValue($p1)) {
				$0['api.filterPeriodType'] = $p1.periodType;
				$0['api.filterDateRangeType'] = $p1.rangeType;
				if ($p1.rangeType === 'lastn' || $p1.rangeType === 'nextn') {
					if (ss.isNullOrUndefined($p1.rangeN)) {
						throw tab._TableauException.create('missingRangeNForRelativeDateFilters', 'Missing rangeN field for a relative date filter of LASTN or NEXTN.');
					}
					$0['api.filterDateRange'] = $p1.rangeN;
				}
				if (ss.isValue($p1.anchorDate)) {
					$0['api.filterDateArchorValue'] = tab._Utility.serializeDateForServer($p1.anchorDate);
				}
			}
			this.$14($0);
			var $1 = new tab._Deferred();
			var $2 = tab._WorksheetImpl.$20('api.ApplyRelativeDateFilterCommand', $p0, $1);
			this.sendCommand($0, $2);
			return $1.get_promise();
		},
		$25: function($p0, $p1, $p2, $p3) {
			this.$13();
			if (tab._Utility.isNullOrEmpty($p0)) {
				throw tab._TableauException.createNullOrEmptyParameter('fieldName');
			}
			$p2 = tab._Enums.$2($p2, 'updateType');
			var $0 = null;
			var $1 = null;
			if (tab._jQueryShim.$12($p1)) {
				$0 = [];
				var $5 = $p1;
				for (var $6 = 0; $6 < $5.length; $6++) {
					$0.push($5[$6].toString());
				}
			} else if (tab._Utility.isString($p1)) {
				$0 = [];
				$0.push($p1.toString());
			} else if (ss.isValue($p1) && ss.isValue($p1.levels)) {
				var $7 = $p1.levels;
				$1 = [];
				if (tab._jQueryShim.$12($7)) {
					var $8 = $7;
					for (var $9 = 0; $9 < $8.length; $9++) {
						$1.push($8[$9].toString());
					}
				} else {
					$1.push($7.toString());
				}
			} else if (ss.isValue($p1)) {
				throw tab._TableauException.createInvalidParameter('values');
			}
			var $2 = {};
			$2['api.fieldCaption'] = $p0;
			$2['api.filterUpdateType'] = $p2;
			$2['api.exclude'] = (ss.isValue($p3) && $p3.isExcludeMode) ? true : false;
			if ($0 != null) {
				$2['api.filterHierarchicalValues'] = tab.JsonUtil.toJson($0, false, '');
			}
			if ($1 != null) {
				$2['api.filterHierarchicalLevels'] = tab.JsonUtil.toJson($1, false, '');
			}
			this.$14($2);
			var $3 = new tab._Deferred();
			var $4 = tab._WorksheetImpl.$20('api.ApplyHierarchicalFilterCommand', $p0, $3);
			this.sendCommand($2, $4);
			return $3.get_promise();
		},
		get_selectedMarks: function() {
			return this.$27;
		},
		set_selectedMarks: function(value) {
			this.$27 = value;
			return value;
		},
		$28: function() {
			this.$13();
			var $0 = new tab._Deferred();
			var $1 = {};
			this.$14($1);
			$1['api.filterUpdateType'] = 'replace';
			var $2 = new tab._CommandReturnHandler('api.SelectMarksCommand', 1, function($p1_0) {
				$0.resolve();
			}, function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$29: function($p0, $p1, $p2) {
			this.$13();
			if ($p0 == null && $p1 == null) {
				return this.$28();
			}
			if (tab._Utility.isString($p0) && (tab._jQueryShim.$12($p1) || tab._Utility.isString($p1) || !tab._Enums.$4($p1))) {
				return this.$2C($p0, $p1, $p2);
			} else if (tab._jQueryShim.$12($p0)) {
				return this.$2E($p0, $p1);
			} else {
				return this.$2D($p0, $p1);
			}
		},
		$2A: function() {
			this.$13();
			var $0 = new tab._Deferred();
			var $1 = {};
			this.$14($1);
			var $2 = new tab._CommandReturnHandler('api.FetchSelectedMarksCommand', 0, ss.Delegate.create(this, function($p1_0) {
				var $1_0 = $p1_0;
				this.$27 = tab._MarkImpl.$6($1_0);
				$0.resolve(this.$27._toApiCollection());
			}), function($p1_0, $p1_1) {
				$0.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($1, $2);
			return $0.get_promise();
		},
		$2C: function($p0, $p1, $p2) {
			var $0 = [];
			var $1 = [];
			var $2 = [];
			var $3 = [];
			var $4 = [];
			var $5 = [];
			this.$2F($0, $1, $2, $3, $4, $5, $p0, $p1);
			return this.$31(null, $0, $1, $2, $3, $4, $5, $p2);
		},
		$2D: function($p0, $p1) {
			var $0 = $p0;
			var $1 = [];
			var $2 = [];
			var $3 = [];
			var $4 = [];
			var $5 = [];
			var $6 = [];
			var $dict1 = $0;
			for (var $key2 in $dict1) {
				var $7 = {
					key: $key2,
					value: $dict1[$key2]
				};
				if ($p0.hasOwnProperty($7.key)) {
					if (!tab._jQueryShim.$11($0[$7.key])) {
						this.$2F($1, $2, $3, $4, $5, $6, $7.key, $7.value);
					}
				}
			}
			return this.$31(null, $1, $2, $3, $4, $5, $6, $p1);
		},
		$2E: function($p0, $p1) {
			var $0 = [];
			var $1 = [];
			var $2 = [];
			var $3 = [];
			var $4 = [];
			var $5 = [];
			var $6 = [];
			for (var $7 = 0; $7 < $p0.length; $7++) {
				var $8 = $p0[$7];
				if (ss.isValue($8.$0.get_$4()) && $8.$0.get_$4() > 0) {
					$6.push($8.$0.get_$4());
				} else {
					var $9 = $8.$0.get_$3();
					for (var $A = 0; $A < $9.get__length(); $A++) {
						var $B = $9.get_item($A);
						if ($B.hasOwnProperty('fieldName') && $B.hasOwnProperty('value') && !tab._jQueryShim.$11($B.fieldName) && !tab._jQueryShim.$11($B.value)) {
							this.$2F($0, $1, $2, $3, $4, $5, $B.fieldName, $B.value);
						}
					}
				}
			}
			return this.$31($6, $0, $1, $2, $3, $4, $5, $p1);
		},
		$2F: function($p0, $p1, $p2, $p3, $p4, $p5, $p6, $p7) {
			var $0 = $p7;
			if (tab._WorksheetImpl.$26.test($p6)) {
				this.$30($p2, $p3, $p6, $p7);
			} else if (ss.isValue($0.min) || ss.isValue($0.max)) {
				var $1 = {};
				if (ss.isValue($0.min)) {
					if (tab._Utility.isDate($0.min)) {
						var $3 = $0.min;
						if (tab._Utility.isDateValid($3)) {
							$1.min = tab._Utility.serializeDateForServer($3);
						} else {
							throw tab._TableauException.createInvalidDateParameter('options.min');
						}
					} else {
						$1.min = $0.min;
					}
				}
				if (ss.isValue($0.max)) {
					if (tab._Utility.isDate($0.max)) {
						var $4 = $0.max;
						if (tab._Utility.isDateValid($4)) {
							$1.max = tab._Utility.serializeDateForServer($4);
						} else {
							throw tab._TableauException.createInvalidDateParameter('options.max');
						}
					} else {
						$1.max = $0.max;
					}
				}
				if (ss.isValue($0.nullOption)) {
					var $5 = tab._Enums.$5($0.nullOption, 'options.nullOption');
					$1.nullOption = $5;
				} else {
					$1.nullOption = 'allValues';
				}
				var $2 = tab.JsonUtil.toJson($1, false, '');
				this.$30($p4, $p5, $p6, $2);
			} else {
				this.$30($p0, $p1, $p6, $p7);
			}
		},
		$30: function($p0, $p1, $p2, $p3) {
			var $0 = [];
			if (tab._jQueryShim.$12($p3)) {
				var $1 = $p3;
				for (var $2 = 0; $2 < $1.length; $2++) {
					$0.push($1[$2]);
				}
			} else {
				$0.push($p3);
			}
			$p1.push($0);
			$p0.push($p2);
		},
		$31: function($p0, $p1, $p2, $p3, $p4, $p5, $p6, $p7) {
			var $0 = {};
			this.$14($0);
			$p7 = tab._Enums.$3($p7, 'updateType');
			$0['api.filterUpdateType'] = $p7;
			if (!tab._Utility.isNullOrEmpty($p0)) {
				$0['api.tupleIds'] = tab.JsonUtil.toJson($p0, false, '');
			}
			if (!tab._Utility.isNullOrEmpty($p1) && !tab._Utility.isNullOrEmpty($p2)) {
				$0['api.categoricalFieldCaption'] = tab.JsonUtil.toJson($p1, false, '');
				var $3 = [];
				for (var $4 = 0; $4 < $p2.length; $4++) {
					var $5 = tab.JsonUtil.toJson($p2[$4], false, '');
					$3.push($5);
				}
				$0['api.categoricalMarkValues'] = tab.JsonUtil.toJson($3, false, '');
			}
			if (!tab._Utility.isNullOrEmpty($p3) && !tab._Utility.isNullOrEmpty($p4)) {
				$0['api.hierarchicalFieldCaption'] = tab.JsonUtil.toJson($p3, false, '');
				var $6 = [];
				for (var $7 = 0; $7 < $p4.length; $7++) {
					var $8 = tab.JsonUtil.toJson($p4[$7], false, '');
					$6.push($8);
				}
				$0['api.hierarchicalMarkValues'] = tab.JsonUtil.toJson($6, false, '');
			}
			if (!tab._Utility.isNullOrEmpty($p5) && !tab._Utility.isNullOrEmpty($p6)) {
				$0['api.rangeFieldCaption'] = tab.JsonUtil.toJson($p5, false, '');
				var $9 = [];
				for (var $A = 0; $A < $p6.length; $A++) {
					var $B = tab.JsonUtil.toJson($p6[$A], false, '');
					$9.push($B);
				}
				$0['api.rangeMarkValues'] = tab.JsonUtil.toJson($9, false, '');
			}
			if (tab._Utility.isNullOrEmpty($0['api.tupleIds']) && tab._Utility.isNullOrEmpty($0['api.categoricalFieldCaption']) && tab._Utility.isNullOrEmpty($0['api.hierarchicalFieldCaption']) && tab._Utility.isNullOrEmpty($0['api.rangeFieldCaption'])) {
				throw tab._TableauException.createInvalidParameter('fieldNameOrFieldValuesMap');
			}
			var $1 = new tab._Deferred();
			var $2 = new tab._CommandReturnHandler('api.SelectMarksCommand', 1, function($p1_0) {
				var $1_0 = tab._WorksheetImpl.$2B($p1_0);
				if ($1_0 == null) {
					$1.resolve();
				} else {
					$1.reject($1_0);
				}
			}, function($p1_0, $p1_1) {
				$1.reject(tab._TableauException.createServerError($p1_1));
			});
			this.sendCommand($0, $2);
			return $1.get_promise();
		}
	}
	tab.JsonUtil = function() {}
	tab.JsonUtil.parseJson = function(jsonValue) {
		return tab._jQueryShim.parseJSON(jsonValue);
	}
	tab.JsonUtil.toJson = function(it, pretty, indentStr) {
		pretty = (pretty || false);
		indentStr = (indentStr || '');
		var $0 = [];
		return tab.JsonUtil.$3(it, pretty, indentStr, $0);
	}
	tab.JsonUtil.$1 = function($p0, $p1, $p2) {
		if (ss.isValue((Array).prototype['indexOf'])) {
			return $p0.indexOf($p1, $p2);
		}
		$p2 = ($p2 || 0);
		var $0 = $p0.length;
		if ($0 > 0) {
			for (var $1 = $p2; $1 < $0; $1++) {
				if ($p0[$1] === $p1) {
					return $1;
				}
			}
		}
		return -1;
	}
	tab.JsonUtil.$2 = function($p0, $p1, $p2) {
		var $0 = tab.JsonUtil.$1($p0, $p1, $p2);
		return $0 >= 0;
	}
	tab.JsonUtil.$3 = function($p0, $p1, $p2, $p3) {
		if (tab.JsonUtil.$2($p3, $p0)) {
			throw Error.createError('The object contains recursive reference of sub-objects', null);
		}
		if (ss.isUndefined($p0)) {
			return 'undefined';
		}
		if ($p0 == null) {
			return 'null';
		}
		var $0 = tab._jQueryShim.$13($p0);
		if ($0 === 'number' || $0 === 'boolean') {
			return $p0.toString();
		}
		if ($0 === 'string') {
			return tab.JsonUtil.$6($p0);
		}
		$p3.push($p0);
		var $1;
		$p2 = ($p2 || '');
		var $2 = ($p1) ? $p2 + '\t' : '';
		var $3 = ($p0.__json__ || $p0.json);
		if (tab._jQueryShim.$11($3)) {
			var $6 = $3;
			$1 = $6($p0);
			if ($p0 !== $1) {
				var $7 = tab.JsonUtil.$3($1, $p1, $2, $p3);
				$p3.pop();
				return $7;
			}
		}
		if (ss.isValue($p0.nodeType) && ss.isValue($p0.cloneNode)) {
			throw Error.createError("Can't serialize DOM nodes", null);
		}
		var $4 = ($p1) ? ' ' : '';
		var $5 = ($p1) ? '\n' : '';
		if (tab._jQueryShim.$12($p0)) {
			return tab.JsonUtil.$5($p0, $p1, $p2, $p3, $2, $5);
		}
		if ($0 === 'function') {
			$p3.pop();
			return null;
		}
		return tab.JsonUtil.$4($p0, $p1, $p2, $p3, $2, $5, $4);
	}
	tab.JsonUtil.$4 = function($p0, $p1, $p2, $p3, $p4, $p5, $p6) {
		var $0 = $p0;
		var $1 = new ss.StringBuilder('{');
		var $2 = false;
		var $dict1 = $0;
		for (var $key2 in $dict1) {
			var $3 = {
				key: $key2,
				value: $dict1[$key2]
			};
			var $4;
			var $5;
			if (typeof($3.key) === 'number') {
				$4 = '"' + $3.key + '"';
			} else if (typeof($3.key) === 'string') {
				$4 = tab.JsonUtil.$6($3.key);
			} else {
				continue;
			}
			$5 = tab.JsonUtil.$3($3.value, $p1, $p4, $p3);
			if ($5 == null) {
				continue;
			}
			if ($2) {
				$1.append(',');
			}
			$1.append($p5 + $p4 + $4 + ':' + $p6 + $5);
			$2 = true;
		}
		$1.append($p5 + $p2 + '}');
		$p3.pop();
		return $1.toString();
	}
	tab.JsonUtil.$5 = function($p0, $p1, $p2, $p3, $p4, $p5) {
		var $0 = false;
		var $1 = new ss.StringBuilder('[');
		var $2 = $p0;
		for (var $3 = 0; $3 < $2.length; $3++) {
			var $4 = $2[$3];
			var $5 = tab.JsonUtil.$3($4, $p1, $p4, $p3);
			if ($5 == null) {
				$5 = 'undefined';
			}
			if ($0) {
				$1.append(',');
			}
			$1.append($p5 + $p4 + $5);
			$0 = true;
		}
		$1.append($p5 + $p2 + ']');
		$p3.pop();
		return $1.toString();
	}
	tab.JsonUtil.$6 = function($p0) {
		$p0 = ('"' + $p0.replace(/(["\\])/g, '\\$1') + '"');
		$p0 = $p0.replace(new RegExp('[\u000c]', 'g'), '\\f');
		$p0 = $p0.replace(new RegExp('[\u0008]', 'g'), '\\b');
		$p0 = $p0.replace(new RegExp('[\n]', 'g'), '\\n');
		$p0 = $p0.replace(new RegExp('[\t]', 'g'), '\\t');
		$p0 = $p0.replace(new RegExp('[\r]', 'g'), '\\r');
		return $p0;
	}
	Type.registerNamespace('tableauSoftware');
	tab.$create_DataValue = function(value, formattedValue, aliasedValue) {
		var $o = {};
		$o.value = value;
		if (tab._Utility.isNullOrEmpty(aliasedValue)) {
			$o.formattedValue = formattedValue;
		} else {
			$o.formattedValue = aliasedValue;
		}
		return $o;
	}
	tab.$create_Point = function(x, y) {
		var $o = {};
		$o.x = x;
		$o.y = y;
		return $o;
	}
	tab.$create_Size = function(width, height) {
		var $o = {};
		$o.width = width;
		$o.height = height;
		return $o;
	}
	tab.$create_SheetSize = function(behavior, minSize, maxSize) {
		var $o = {};
		$o.behavior = (behavior || 'automatic');
		if (ss.isValue(minSize)) {
			$o.minSize = minSize;
		}
		if (ss.isValue(maxSize)) {
			$o.maxSize = maxSize;
		}
		return $o;
	}
	tableauSoftware.CustomView = function(customViewImpl) {
		this._impl = customViewImpl;
	}
	tableauSoftware.CustomView.prototype = {
		_impl: null,
		getWorkbook: function() {
			return this._impl.get_$B();
		},
		getUrl: function() {
			return this._impl.get_$C();
		},
		getName: function() {
			return this._impl.get_$D();
		},
		setName: function(value) {
			this._impl.set_$D(value);
		},
		getOwnerName: function() {
			return this._impl.get_$E();
		},
		getAdvertised: function() {
			return this._impl.get_$F();
		},
		setAdvertised: function(value) {
			this._impl.set_$F(value);
		},
		getDefault: function() {
			return this._impl.get_$10();
		},
		saveAsync: function() {
			return this._impl.$11();
		}
	}
	tab.CustomViewEvent = function(eventName, viz, customViewImpl) {
		tab.CustomViewEvent.initializeBase(this, [eventName, viz]);
		this.$2 = new tab.JavaScriptApi$6(viz._impl.get__workbookImpl(), customViewImpl);
	}
	tab.CustomViewEvent.prototype = {
		$2: null,
		getCustomViewAsync: function() {
			var $0 = new tab._Deferred();
			$0.resolve(this.$2.get__customViewImpl().get_$A());
			return $0.get_promise();
		}
	}
	tab.JavaScriptApi$6 = function(workbook, customViewImpl) {
		tab.JavaScriptApi$6.initializeBase(this, [workbook, null]);
		this.$2 = customViewImpl;
	}
	tab.JavaScriptApi$6.prototype = {
		$2: null,
		get__customViewImpl: function() {
			return this.$2;
		}
	}
	tableauSoftware.Dashboard = function(dashboardImpl) {
		tableauSoftware.Dashboard.initializeBase(this, [dashboardImpl]);
	}
	tableauSoftware.Dashboard.prototype = {
		_impl: null,
		getParentStoryPoint: function() {
			return this._impl.get_parentStoryPoint();
		},
		getObjects: function() {
			return this._impl.get_objects()._toApiCollection();
		},
		getWorksheets: function() {
			return this._impl.get_worksheets()._toApiCollection();
		}
	}
	tableauSoftware.DashboardObject = function(frameInfo, dashboard, worksheet) {
		if (frameInfo.$0 === 'worksheet' && ss.isNullOrUndefined(worksheet)) {
			throw tab._TableauException.createInternalError('worksheet parameter is required for WORKSHEET objects');
		} else if (frameInfo.$0 !== 'worksheet' && ss.isValue(worksheet)) {
			throw tab._TableauException.createInternalError('worksheet parameter should be undefined for non-WORKSHEET objects');
		}
		this.$0 = frameInfo;
		this.$1 = dashboard;
		this.$2 = worksheet;
	}
	tableauSoftware.DashboardObject.prototype = {
		$0: null,
		$1: null,
		$2: null,
		getObjectType: function() {
			return this.$0.$0;
		},
		getDashboard: function() {
			return this.$1;
		},
		getWorksheet: function() {
			return this.$2;
		},
		getPosition: function() {
			return this.$0.$2;
		},
		getSize: function() {
			return this.$0.$3;
		}
	}
	tableauSoftware.DataSource = function(impl) {
		this.$0 = impl;
	}
	tableauSoftware.DataSource.prototype = {
		$0: null,
		getName: function() {
			return this.$0.get_$6();
		},
		getFields: function() {
			return this.$0.get_$7()._toApiCollection();
		},
		getIsPrimary: function() {
			return this.$0.get_$8();
		}
	}
	tableauSoftware.Field = function(dataSource, name, fieldRoleType, fieldAggrType) {
		this.$0 = dataSource;
		this.$1 = name;
		this.$2 = fieldRoleType;
		this.$3 = fieldAggrType;
	}
	tableauSoftware.Field.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: null,
		getDataSource: function() {
			return this.$0;
		},
		getName: function() {
			return this.$1;
		},
		getRole: function() {
			return this.$2;
		},
		getAggregation: function() {
			return this.$3;
		}
	}
	tableauSoftware.CategoricalFilter = function(worksheetImpl, filterJson) {
		tableauSoftware.CategoricalFilter.initializeBase(this, [worksheetImpl, filterJson]);
		this.$D(filterJson);
	}
	tableauSoftware.CategoricalFilter.prototype = {
		$B: false,
		$C: null,
		getIsExcludeMode: function() {
			return this.$B;
		},
		getAppliedValues: function() {
			return this.$C;
		},
		_updateFromJson: function(filterJson) {
			this.$D(filterJson);
		},
		$D: function($p0) {
			this.$B = $p0.isExclude;
			if (ss.isValue($p0.catAppliedValues)) {
				this.$C = [];
				var $enum1 = ss.IEnumerator.getEnumerator($p0.catAppliedValues);
				while ($enum1.moveNext()) {
					var $0 = $enum1.current;
					this.$C.push(tab._Utility.getDataValue($0));
				}
			}
		}
	}
	tableauSoftware.Filter = function(worksheetImpl, filterJson) {
		this.$0 = worksheetImpl;
		this.$A(filterJson);
	}
	tableauSoftware.Filter.$7 = function($p0, $p1) {
		switch ($p1.type) {
			case 'C':
				return new tableauSoftware.CategoricalFilter($p0, $p1);
			case 'RD':
				return new tableauSoftware.RelativeDateFilter($p0, $p1);
			case 'H':
				return new tableauSoftware.HierarchicalFilter($p0, $p1);
			case 'Q':
				return new tableauSoftware.QuantitativeFilter($p0, $p1);
		}
		return null;
	}
	tableauSoftware.Filter.$8 = function($p0, $p1) {
		var $0 = new tab._Collection();
		var $enum1 = ss.IEnumerator.getEnumerator($p1.filters);
		while ($enum1.moveNext()) {
			var $1 = $enum1.current;
			var $2 = tableauSoftware.Filter.$7($p0, $1);
			$0._add($1.caption, $2);
		}
		return $0;
	}
	tableauSoftware.Filter.$9 = function($p0) {
		switch ($p0) {
			case 'dimension':
				return 'dimension';
			case 'measure':
				return 'measure';
		}
		return 'unknown';
	}
	tableauSoftware.Filter.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: null,
		$4: null,
		$5: null,
		$6: null,
		getFilterType: function() {
			return this.$1;
		},
		getFieldName: function() {
			return this.$2;
		},
		getWorksheet: function() {
			return this.$0.get_worksheet();
		},
		getFieldAsync: function() {
			var $0 = new tab._Deferred();
			if (this.$3 == null) {
				var $1 = function($p1_0) {
					$0.reject($p1_0);
					return null;
				};
				var $2 = ss.Delegate.create(this, function($p1_0) {
					this.$3 = new tableauSoftware.Field($p1_0, this.$2, this.$5, this.$6);
					$0.resolve(this.$3);
					return null;
				});
				this.$0.$12(this.$4).then($2, $1);
			} else {
				window.setTimeout(ss.Delegate.create(this, function() {
					$0.resolve(this.$3);
				}), 0);
			}
			return $0.get_promise();
		},
		_update: function($p0) {
			this.$A($p0);
			this._updateFromJson($p0);
		},
		_addFieldParams: function($p0) {},
		$A: function($p0) {
			this.$2 = $p0.caption;
			switch ($p0.type) {
				case 'C':
					this.$1 = 'categorical';
					break;
				case 'RD':
					this.$1 = 'relativedate';
					break;
				case 'H':
					this.$1 = 'hierarchical';
					break;
				case 'Q':
					this.$1 = 'quantitative';
					break;
			}
			this.$3 = null;
			this.$4 = $p0.datasourceName;
			this.$5 = tableauSoftware.Filter.$9($p0.fieldRoleType);
			this.$6 = tab.JavaScriptApi$3.$9($p0.fieldAggrType);
		}
	}
	tab.FilterEvent = function(eventName, viz, worksheetImpl, fieldName, filterCaption) {
		tab.FilterEvent.initializeBase(this, [eventName, viz, worksheetImpl]);
		this.$3 = filterCaption;
		this.$4 = new tab.JavaScriptApi$5(viz._impl.get__workbookImpl(), worksheetImpl, fieldName, filterCaption);
	}
	tab.FilterEvent.prototype = {
		$3: null,
		$4: null,
		getFieldName: function() {
			return this.$3;
		},
		getFilterAsync: function() {
			return this.$4.get__worksheetImpl().$17(this.$4.get__filterFieldName(), null, null);
		}
	}
	tab.JavaScriptApi$5 = function(workbookImpl, worksheetImpl, fieldFieldName, filterCaption) {
		tab.JavaScriptApi$5.initializeBase(this, [workbookImpl, worksheetImpl]);
		this.$2 = fieldFieldName;
		this.$3 = filterCaption;
	}
	tab.JavaScriptApi$5.prototype = {
		$2: null,
		$3: null,
		get__filterFieldName: function() {
			return this.$2;
		},
		get_$4: function() {
			return this.$3;
		}
	}
	tableauSoftware.HierarchicalFilter = function(worksheetImpl, filterJson) {
		tableauSoftware.HierarchicalFilter.initializeBase(this, [worksheetImpl, filterJson]);
		this.$C(filterJson);
	}
	tableauSoftware.HierarchicalFilter.prototype = {
		$B: 0,
		_addFieldParams: function($p0) {
			$p0['api.filterHierarchicalLevels'] = this.$B;
		},
		_updateFromJson: function(filterJson) {
			this.$C(filterJson);
		},
		$C: function($p0) {
			this.$B = $p0.levels;
		}
	}
	tableauSoftware.QuantitativeFilter = function(worksheetImpl, filterJson) {
		tableauSoftware.QuantitativeFilter.initializeBase(this, [worksheetImpl, filterJson]);
		this.$10(filterJson);
	}
	tableauSoftware.QuantitativeFilter.prototype = {
		$B: null,
		$C: null,
		$D: null,
		$E: null,
		$F: false,
		getMin: function() {
			return this.$D;
		},
		getMax: function() {
			return this.$E;
		},
		getIncludeNullValues: function() {
			return this.$F;
		},
		getDomainMin: function() {
			return this.$B;
		},
		getDomainMax: function() {
			return this.$C;
		},
		_updateFromJson: function(filterJson) {
			this.$10(filterJson);
		},
		$10: function($p0) {
			this.$B = tab._Utility.getDataValue($p0.domainMinValue);
			this.$C = tab._Utility.getDataValue($p0.domainMaxValue);
			this.$D = tab._Utility.getDataValue($p0.minValue);
			this.$E = tab._Utility.getDataValue($p0.maxValue);
			this.$F = $p0.includeNullValues;
		}
	}
	tableauSoftware.RelativeDateFilter = function(worksheetImpl, filterJson) {
		tableauSoftware.RelativeDateFilter.initializeBase(this, [worksheetImpl, filterJson]);
		this.$E(filterJson);
	}
	tableauSoftware.RelativeDateFilter.prototype = {
		$B: null,
		$C: null,
		$D: 0,
		getPeriod: function() {
			return this.$B;
		},
		getRange: function() {
			return this.$C;
		},
		getRangeN: function() {
			return this.$D;
		},
		_updateFromJson: function(filterJson) {
			this.$E(filterJson);
		},
		$E: function($p0) {
			if (ss.isValue($p0.periodType)) {
				this.$B = tab._Enums.$0($p0.periodType, 'periodType');
			}
			if (ss.isValue($p0.rangeType)) {
				this.$C = tab._Enums.$1($p0.rangeType, 'rangeType');
			}
			if (ss.isValue($p0.rangeN)) {
				this.$D = $p0.rangeN;
			}
		}
	}
	tab._LoadFeedback = function() {}
	tab._LoadFeedback.prototype = {
		$0: null,
		$1: null,
		$2: null,
		$3: function($p0) {
			this.$0 = $p0.$0;
			var $0 = this.$0.style;
			this.$2 = $0.display;
			$0.position = 'relative';
			$0.overflow = 'hidden';
			$0.display = 'none';
			var $1 = [];
			$1.push('<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 0; padding: 0; margin: 0">');
			$1.push('</div>');
			var $2 = document.createElement('div');
			$2.innerHTML = $1.join('');
			this.$1 = $2.firstChild;
			this.$0.appendChild(this.$1);
			$2.innerHTML = '';
			$2 = null;
		},
		$4: function() {
			if (ss.isValue(this.$0)) {
				this.$0.style.display = this.$2;
			}
		},
		$5: function() {
			if (ss.isValue(this.$1)) {
				this.$1.innerHTML = '';
				this.$1.parentNode.removeChild(this.$1);
				this.$1 = null;
			}
		}
	}
	tableauSoftware.Mark = function(tupleId) {
		this.$0 = new tab._MarkImpl(tupleId);
	}
	tableauSoftware.Mark.prototype = {
		$0: null,
		getPairs: function() {
			return this.$0.get_$5();
		}
	}
	tab.MarksEvent = function(eventName, viz, worksheetImpl) {
		tab.MarksEvent.initializeBase(this, [eventName, viz, worksheetImpl]);
		this.$3 = new tab.JavaScriptApi$8(viz._impl.get__workbookImpl(), worksheetImpl);
	}
	tab.MarksEvent.prototype = {
		$3: null,
		getMarksAsync: function() {
			var $0 = this.$3.get__worksheetImpl();
			if (ss.isValue($0.get_selectedMarks())) {
				var $1 = new tab._Deferred();
				return $1.resolve($0.get_selectedMarks()._toApiCollection());
			}
			return $0.$2A();
		}
	}
	tab.JavaScriptApi$8 = function(workbookImpl, worksheetImpl) {
		tab.JavaScriptApi$8.initializeBase(this, [workbookImpl, worksheetImpl]);
	}
	tableauSoftware.Pair = function(fieldName, value) {
		this.fieldName = fieldName;
		this.value = value;
		this.formattedValue = (ss.isValue(value)) ? value.toString() : '';
	}
	tableauSoftware.Pair.prototype = {
		fieldName: null,
		value: null,
		formattedValue: null
	}
	tableauSoftware.Parameter = function(impl) {
		this._impl = impl;
	}
	tableauSoftware.Parameter.prototype = {
		_impl: null,
		getName: function() {
			return this._impl.get_$B();
		},
		getCurrentValue: function() {
			return this._impl.get_$C();
		},
		getDataType: function() {
			return this._impl.get_$D();
		},
		getAllowableValuesType: function() {
			return this._impl.get_$E();
		},
		getAllowableValues: function() {
			return this._impl.get_$F();
		},
		getMinValue: function() {
			return this._impl.get_$10();
		},
		getMaxValue: function() {
			return this._impl.get_$11();
		},
		getStepSize: function() {
			return this._impl.get_$12();
		},
		getDateStepPeriod: function() {
			return this._impl.get_$13();
		}
	}
	tab.ParameterEvent = function(eventName, viz, parameterName) {
		tab.ParameterEvent.initializeBase(this, [eventName, viz]);
		this.$2 = new tab.JavaScriptApi$7(viz._impl.get__workbookImpl(), parameterName);
	}
	tab.ParameterEvent.prototype = {
		$2: null,
		getParameterName: function() {
			return this.$2.get__parameterName();
		},
		getParameterAsync: function() {
			return this.$2.get__workbookImpl().$25(this.$2.get__parameterName());
		}
	}
	tab.JavaScriptApi$7 = function(workbookImpl, parameterName) {
		tab.JavaScriptApi$7.initializeBase(this, [workbookImpl, null]);
		this.$2 = parameterName;
	}
	tab.JavaScriptApi$7.prototype = {
		$2: null,
		get__parameterName: function() {
			return this.$2;
		}
	}
	tableauSoftware.Sheet = function(sheetImpl) {
		tab._Param.verifyValue(sheetImpl, 'sheetImpl');
		this._impl = sheetImpl;
	}
	tableauSoftware.Sheet.prototype = {
		_impl: null,
		getName: function() {
			return this._impl.get_name();
		},
		getIndex: function() {
			return this._impl.get_index();
		},
		getWorkbook: function() {
			return this._impl.get_workbookImpl().get_workbook();
		},
		getSize: function() {
			return this._impl.get_size();
		},
		getIsHidden: function() {
			return this._impl.get_isHidden();
		},
		getIsActive: function() {
			return this._impl.get_isActive();
		},
		getSheetType: function() {
			return this._impl.get_sheetType();
		},
		getUrl: function() {
			return this._impl.get_url();
		},
		changeSizeAsync: function(size) {
			return this._impl.changeSizeAsync(size);
		}
	}
	tableauSoftware.SheetInfo = function(impl) {
		this.$0 = impl;
	}
	tableauSoftware.SheetInfo.prototype = {
		$0: null,
		getName: function() {
			return this.$0.name;
		},
		getSheetType: function() {
			return this.$0.sheetType;
		},
		getSize: function() {
			return this.$0.size;
		},
		getIndex: function() {
			return this.$0.index;
		},
		getUrl: function() {
			return this.$0.url;
		},
		getIsActive: function() {
			return this.$0.isActive;
		},
		getIsHidden: function() {
			return this.$0.isHidden;
		},
		getWorkbook: function() {
			return this.$0.workbook;
		}
	}
	tab.SheetSizeFactory = function() {}
	tab.SheetSizeFactory.createAutomatic = function() {
		var $0 = tab.$create_SheetSize('automatic', null, null);
		return $0;
	}
	tableauSoftware.Story = function(storyImpl) {
		tableauSoftware.Story.initializeBase(this, [storyImpl]);
	}
	tableauSoftware.Story.prototype = {
		_impl: null,
		getActiveStoryPoint: function() {
			return this._impl.get_activeStoryPointImpl().get_storyPoint();
		},
		getStoryPointsInfo: function() {
			return this._impl.get_storyPointsInfo();
		},
		activatePreviousStoryPointAsync: function() {
			return this._impl.activatePreviousStoryPointAsync();
		},
		activateNextStoryPointAsync: function() {
			return this._impl.activateNextStoryPointAsync();
		},
		activateStoryPointAsync: function(index) {
			return this._impl.activateStoryPointAsync(index);
		},
		revertStoryPointAsync: function(index) {
			return this._impl.revertStoryPointAsync(index);
		}
	}
	tableauSoftware.StoryPoint = function(impl) {
		this.$0 = impl;
	}
	tableauSoftware.StoryPoint.prototype = {
		$0: null,
		getCaption: function() {
			return this.$0.get_caption();
		},
		getContainedSheet: function() {
			return (ss.isValue(this.$0.get_containedSheetImpl())) ? this.$0.get_containedSheetImpl().get_sheet() : null;
		},
		getIndex: function() {
			return this.$0.get_index();
		},
		getIsActive: function() {
			return this.$0.get_isActive();
		},
		getIsUpdated: function() {
			return this.$0.get_isUpdated();
		},
		getParentStory: function() {
			return this.$0.get_parentStoryImpl().get_story();
		}
	}
	tableauSoftware.StoryPointInfo = function(impl) {
		this._impl = impl;
	}
	tableauSoftware.StoryPointInfo.prototype = {
		_impl: null,
		getCaption: function() {
			return this._impl.caption;
		},
		getIndex: function() {
			return this._impl.index;
		},
		getIsActive: function() {
			return this._impl.isActive;
		},
		getIsUpdated: function() {
			return this._impl.isUpdated;
		},
		getParentStory: function() {
			return this._impl.parentStoryImpl.get_story();
		}
	}
	tab.StoryPointSwitchEvent = function(eventName, viz, oldStoryPointInfo, newStoryPoint) {
		tab.StoryPointSwitchEvent.initializeBase(this, [eventName, viz]);
		this.$2 = oldStoryPointInfo;
		this.$3 = newStoryPoint;
	}
	tab.StoryPointSwitchEvent.prototype = {
		$2: null,
		$3: null,
		getOldStoryPointInfo: function() {
			return this.$2;
		},
		getNewStoryPoint: function() {
			return this.$3;
		}
	}
	tab.TableauEvent = function(eventName, viz) {
		this.$0 = viz;
		this.$1 = eventName;
	}
	tab.TableauEvent.prototype = {
		$0: null,
		$1: null,
		getViz: function() {
			return this.$0;
		},
		getEventName: function() {
			return this.$1;
		}
	}
	tab.EventContext = function(workbookImpl, worksheetImpl) {
		this.$0 = workbookImpl;
		this.$1 = worksheetImpl;
	}
	tab.EventContext.prototype = {
		$0: null,
		$1: null,
		get__workbookImpl: function() {
			return this.$0;
		},
		get__worksheetImpl: function() {
			return this.$1;
		}
	}
	tab.TabSwitchEvent = function(eventName, viz, oldName, newName) {
		tab.TabSwitchEvent.initializeBase(this, [eventName, viz]);
		this.$2 = oldName;
		this.$3 = newName;
	}
	tab.TabSwitchEvent.prototype = {
		$2: null,
		$3: null,
		getOldSheetName: function() {
			return this.$2;
		},
		getNewSheetName: function() {
			return this.$3;
		}
	}
	tableauSoftware.Viz = function(parentElement, url, options) {
		var $0 = tab._ApiObjectRegistry.getCrossDomainMessageRouter();
		this._impl = new tab.VizImpl($0, this, parentElement, url, options);
		this._impl.$3A();
	}
	tableauSoftware.Viz.prototype = {
		_impl: null,
		getAreTabsHidden: function() {
			return this._impl.get_$22();
		},
		getIsToolbarHidden: function() {
			return this._impl.get_$23();
		},
		getIsHidden: function() {
			return this._impl.get_$24();
		},
		getParentElement: function() {
			return this._impl.get_$25();
		},
		getUrl: function() {
			return this._impl.get_$26();
		},
		getWorkbook: function() {
			return this._impl.get_$27();
		},
		getAreAutomaticUpdatesPaused: function() {
			return this._impl.get_$28();
		},
		addEventListener: function(eventName, handler) {
			this._impl.addEventListener(eventName, handler);
		},
		removeEventListener: function(eventName, handler) {
			this._impl.removeEventListener(eventName, handler);
		},
		dispose: function() {
			this._impl.$29();
		},
		show: function() {
			this._impl.$2A();
		},
		hide: function() {
			this._impl.$2B();
		},
		showExportDataDialog: function(worksheetWithinDashboard) {
			this._impl.$2D(worksheetWithinDashboard);
		},
		showExportCrossTabDialog: function(worksheetWithinDashboard) {
			this._impl.$2E(worksheetWithinDashboard);
		},
		showExportImageDialog: function() {
			this._impl.$2C();
		},
		showExportPDFDialog: function() {
			this._impl.$2F();
		},
		revertAllAsync: function() {
			return this._impl.$30();
		},
		refreshDataAsync: function() {
			return this._impl.$31();
		},
		showShareDialog: function() {
			this._impl.$32();
		},
		showDownloadWorkbookDialog: function() {
			this._impl.$33();
		},
		pauseAutomaticUpdatesAsync: function() {
			return this._impl.$34();
		},
		resumeAutomaticUpdatesAsync: function() {
			return this._impl.$35();
		},
		toggleAutomaticUpdatesAsync: function() {
			return this._impl.$36();
		},
		setFrameSize: function(width, height) {
			var $0 = width;
			var $1 = height;
			if (tab._Utility.isNumber(width)) {
				$0 = width + 'px';
			}
			if (tab._Utility.isNumber(height)) {
				$1 = height + 'px';
			}
			this._impl.$37($0, $1);
		}
	}
	tableauSoftware.VizManager = function() {}
	tableauSoftware.VizManager.getVizs = function() {
		return tab._VizManagerImpl.get_$1();
	}
	tableauSoftware.Workbook = function(workbookImpl) {
		this.$0 = workbookImpl;
	}
	tableauSoftware.Workbook.prototype = {
		$0: null,
		getViz: function() {
			return this.$0.get_viz();
		},
		getPublishedSheetsInfo: function() {
			return this.$0.get_publishedSheets()._toApiCollection();
		},
		getName: function() {
			return this.$0.get_name();
		},
		getActiveSheet: function() {
			return this.$0.get_activeSheetImpl().get_sheet();
		},
		getActiveCustomView: function() {
			return this.$0.get_activeCustomView();
		},
		activateSheetAsync: function(sheetNameOrIndex) {
			return this.$0._setActiveSheetAsync(sheetNameOrIndex);
		},
		revertAllAsync: function() {
			return this.$0._revertAllAsync();
		},
		getCustomViewsAsync: function() {
			return this.$0.$1C();
		},
		showCustomViewAsync: function(customViewName) {
			return this.$0.$1D(customViewName);
		},
		removeCustomViewAsync: function(customViewName) {
			return this.$0.$1E(customViewName);
		},
		rememberCustomViewAsync: function(customViewName) {
			return this.$0.$1F(customViewName);
		},
		setActiveCustomViewAsDefaultAsync: function() {
			return this.$0.$20();
		},
		getParametersAsync: function() {
			return this.$0.$26();
		},
		changeParameterValueAsync: function(parameterName, value) {
			return this.$0.$27(parameterName, value);
		}
	}
	tableauSoftware.Worksheet = function(impl) {
		tableauSoftware.Worksheet.initializeBase(this, [impl]);
	}
	tableauSoftware.Worksheet.prototype = {
		_impl: null,
		getParentDashboard: function() {
			return this._impl.get_parentDashboard();
		},
		getParentStoryPoint: function() {
			return this._impl.get_parentStoryPoint();
		},
		getDataSourcesAsync: function() {
			return this._impl.$11();
		},
		getFilterAsync: function(fieldName, options) {
			return this._impl.$17(null, fieldName, options);
		},
		getFiltersAsync: function(options) {
			return this._impl.$18(options);
		},
		applyFilterAsync: function(fieldName, values, updateType, options) {
			return this._impl.$19(fieldName, values, updateType, options);
		},
		clearFilterAsync: function(fieldName) {
			return this._impl.$1A(fieldName);
		},
		applyRangeFilterAsync: function(fieldName, options) {
			return this._impl.$1B(fieldName, options);
		},
		applyRelativeDateFilterAsync: function(fieldName, options) {
			return this._impl.$1C(fieldName, options);
		},
		applyHierarchicalFilterAsync: function(fieldName, values, updateType, options) {
			return this._impl.$1D(fieldName, values, updateType, options);
		},
		clearSelectedMarksAsync: function() {
			return this._impl.$28();
		},
		selectMarksAsync: function(fieldNameOrFieldValuesMap, valueOrUpdateType, updateType) {
			return this._impl.$29(fieldNameOrFieldValuesMap, valueOrUpdateType, updateType);
		},
		getSelectedMarksAsync: function() {
			return this._impl.$2A();
		}
	}
	tab.WorksheetEvent = function(eventName, viz, worksheetImpl) {
		tab.WorksheetEvent.initializeBase(this, [eventName, viz]);
		this.$2 = worksheetImpl;
	}
	tab.WorksheetEvent.prototype = {
		$2: null,
		getWorksheet: function() {
			return this.$2.get_worksheet();
		}
	}
	tab._jQueryShim = function() {}
	tab._jQueryShim.$11 = function($p0) {
		return tab._jQueryShim.$13($p0) === 'function';
	}
	tab._jQueryShim.$12 = function($p0) {
		if (ss.isValue(Array.isArray)) {
			return Array.isArray($p0);
		}
		return tab._jQueryShim.$13($p0) === 'array';
	}
	tab._jQueryShim.$13 = function($p0) {
		return ($p0 == null) ? String($p0) : (tab._jQueryShim.$8[tab._jQueryShim.$A.call($p0)] || 'object');
	}
	tab._jQueryShim.$14 = function($p0) {
		if (ss.isValue(tab._jQueryShim.$9)) {
			return ($p0 == null) ? '' : tab._jQueryShim.$9.call($p0);
		}
		return ($p0 == null) ? '' : $p0.replace(tab._jQueryShim.$B, '').replace(tab._jQueryShim.$C, '');
	}
	tab._jQueryShim.parseJSON = function($p0) {
		if (typeof($p0) !== 'string' || ss.isNullOrUndefined($p0)) {
			return null;
		}
		$p0 = tab._jQueryShim.$14($p0);
		if (window.JSON && window.JSON.parse) {
			return window.JSON.parse($p0);
		}
		if (tab._jQueryShim.$D.test($p0.replace(tab._jQueryShim.$E, '@').replace(tab._jQueryShim.$F, ']').replace(tab._jQueryShim.$10, ''))) {
			return (new Function("return " + $p0))();
		}
		throw new Error('Invalid JSON: ' + $p0);
	}
	tab._ApiCommand.registerClass('tab._ApiCommand');
	tab._ApiServerResultParser.registerClass('tab._ApiServerResultParser');
	tab.JavaScriptApi$4.registerClass('tab.JavaScriptApi$4');
	tab._CommandReturnHandler.registerClass('tab._CommandReturnHandler');
	tab.JavaScriptApi$1.registerClass('tab.JavaScriptApi$1', null, tab.ICrossDomainMessageRouter);
	tab.JavaScriptApi$0.registerClass('tab.JavaScriptApi$0', null, tab.ICrossDomainMessageHandler);
	tab.CrossDomainMessagingOptions.registerClass('tab.CrossDomainMessagingOptions');
	tab._Enums.registerClass('tab._Enums');
	tab._ApiBootstrap.registerClass('tab._ApiBootstrap');
	tab._ApiObjectRegistry.registerClass('tab._ApiObjectRegistry');
	tab._CustomViewImpl.registerClass('tab._CustomViewImpl');
	tab._SheetImpl.registerClass('tab._SheetImpl');
	tab._DashboardImpl.registerClass('tab._DashboardImpl', tab._SheetImpl);
	tab.JavaScriptApi$3.registerClass('tab.JavaScriptApi$3');
	tab._DeferredUtil.registerClass('tab._DeferredUtil');
	tab._CollectionImpl.registerClass('tab._CollectionImpl');
	tab._DeferredImpl.registerClass('tab._DeferredImpl');
	tab._PromiseImpl.registerClass('tab._PromiseImpl');
	tab._MarkImpl.registerClass('tab._MarkImpl');
	tab._Param.registerClass('tab._Param');
	tab._ParameterImpl.registerClass('tab._ParameterImpl');
	tab._StoryImpl.registerClass('tab._StoryImpl', tab._SheetImpl);
	tab._StoryPointImpl.registerClass('tab._StoryPointImpl');
	tab.StoryPointInfoImplUtil.registerClass('tab.StoryPointInfoImplUtil');
	tab._TableauException.registerClass('tab._TableauException');
	tab._Utility.registerClass('tab._Utility');
	tab.VizImpl.registerClass('tab.VizImpl', null, tab.ICrossDomainMessageHandler);
	tab._VizManagerImpl.registerClass('tab._VizManagerImpl');
	tab._VizParameters.registerClass('tab._VizParameters');
	tab._WorkbookImpl.registerClass('tab._WorkbookImpl');
	tab._WorksheetImpl.registerClass('tab._WorksheetImpl', tab._SheetImpl);
	tab.JsonUtil.registerClass('tab.JsonUtil');
	tableauSoftware.CustomView.registerClass('tableauSoftware.CustomView');
	tab.TableauEvent.registerClass('tab.TableauEvent');
	tab.CustomViewEvent.registerClass('tab.CustomViewEvent', tab.TableauEvent);
	tab.EventContext.registerClass('tab.EventContext');
	tab.JavaScriptApi$6.registerClass('tab.JavaScriptApi$6', tab.EventContext);
	tableauSoftware.Sheet.registerClass('tableauSoftware.Sheet');
	tableauSoftware.Dashboard.registerClass('tableauSoftware.Dashboard', tableauSoftware.Sheet);
	tableauSoftware.DashboardObject.registerClass('tableauSoftware.DashboardObject');
	tableauSoftware.DataSource.registerClass('tableauSoftware.DataSource');
	tableauSoftware.Field.registerClass('tableauSoftware.Field');
	tableauSoftware.Filter.registerClass('tableauSoftware.Filter');
	tableauSoftware.CategoricalFilter.registerClass('tableauSoftware.CategoricalFilter', tableauSoftware.Filter);
	tab.WorksheetEvent.registerClass('tab.WorksheetEvent', tab.TableauEvent);
	tab.FilterEvent.registerClass('tab.FilterEvent', tab.WorksheetEvent);
	tab.JavaScriptApi$5.registerClass('tab.JavaScriptApi$5', tab.EventContext);
	tableauSoftware.HierarchicalFilter.registerClass('tableauSoftware.HierarchicalFilter', tableauSoftware.Filter);
	tableauSoftware.QuantitativeFilter.registerClass('tableauSoftware.QuantitativeFilter', tableauSoftware.Filter);
	tableauSoftware.RelativeDateFilter.registerClass('tableauSoftware.RelativeDateFilter', tableauSoftware.Filter);
	tab._LoadFeedback.registerClass('tab._LoadFeedback');
	tableauSoftware.Mark.registerClass('tableauSoftware.Mark');
	tab.MarksEvent.registerClass('tab.MarksEvent', tab.WorksheetEvent);
	tab.JavaScriptApi$8.registerClass('tab.JavaScriptApi$8', tab.EventContext);
	tableauSoftware.Pair.registerClass('tableauSoftware.Pair');
	tableauSoftware.Parameter.registerClass('tableauSoftware.Parameter');
	tab.ParameterEvent.registerClass('tab.ParameterEvent', tab.TableauEvent);
	tab.JavaScriptApi$7.registerClass('tab.JavaScriptApi$7', tab.EventContext);
	tableauSoftware.SheetInfo.registerClass('tableauSoftware.SheetInfo');
	tab.SheetSizeFactory.registerClass('tab.SheetSizeFactory');
	tableauSoftware.Story.registerClass('tableauSoftware.Story', tableauSoftware.Sheet);
	tableauSoftware.StoryPoint.registerClass('tableauSoftware.StoryPoint');
	tableauSoftware.StoryPointInfo.registerClass('tableauSoftware.StoryPointInfo');
	tab.StoryPointSwitchEvent.registerClass('tab.StoryPointSwitchEvent', tab.TableauEvent);
	tab.TabSwitchEvent.registerClass('tab.TabSwitchEvent', tab.TableauEvent);
	tableauSoftware.Viz.registerClass('tableauSoftware.Viz');
	tableauSoftware.VizManager.registerClass('tableauSoftware.VizManager');
	tableauSoftware.Workbook.registerClass('tableauSoftware.Workbook');
	tableauSoftware.Worksheet.registerClass('tableauSoftware.Worksheet', tableauSoftware.Sheet);
	tab._jQueryShim.registerClass('tab._jQueryShim');
	tab._ApiCommand.crossDomainEventNotificationId = 'xdomainSourceId';
	tab._ApiObjectRegistry.$1 = null;
	tab._ApiObjectRegistry.$2 = null;
	tab.JavaScriptApi$3.$0 = {
		sum: 'SUM',
		average: 'AVG',
		min: 'MIN',
		max: 'MAX',
		'std-dev': 'STDEV',
		'std-dev-p': 'STDEVP',
		'var': 'VAR',
		'var-p': 'VARP',
		count: 'COUNT',
		'count-d': 'COUNTD',
		median: 'MEDIAN',
		attr: 'ATTR',
		none: 'NONE',
		year: 'YEAR',
		qtr: 'QTR',
		month: 'MONTH',
		day: 'DAY',
		hour: 'HOUR',
		minute: 'MINUTE',
		second: 'SECOND',
		week: 'WEEK',
		weekday: 'WEEKDAY',
		'month-year': 'MONTHYEAR',
		mdy: 'MDY',
		end: 'END',
		'trunc-year': 'TRUNC_YEAR',
		'trunc-qtr': 'TRUNC_QTR',
		'trunc-month': 'TRUNC_MONTH',
		'trunc-week': 'TRUNC_WEEK',
		'trunc-day': 'TRUNC_DAY',
		'trunc-hour': 'TRUNC_HOUR',
		'trunc-minute': 'TRUNC_MINUTE',
		'trunc-second': 'TRUNC_SECOND',
		quart1: 'QUART1',
		quart3: 'QUART3',
		skewness: 'SKEWNESS',
		kurtosis: 'KURTOSIS',
		'in-out': 'INOUT',
		'sum-xsqr': 'SUM_XSQR',
		user: 'USER'
	};
	tab._SheetImpl.noZoneId = 4294967295;
	tab._VizManagerImpl.$0 = [];
	tab._WorksheetImpl.$26 = new RegExp('\\[[^\\]]+\\]\\.', 'g');
	tab._jQueryShim.$8 = {
		'[object Boolean]': 'boolean',
		'[object Number]': 'number',
		'[object String]': 'string',
		'[object Function]': 'function',
		'[object Array]': 'array',
		'[object Date]': 'date',
		'[object RegExp]': 'regexp',
		'[object Object]': 'object'
	};
	tab._jQueryShim.$9 = String.prototype.trim;
	tab._jQueryShim.$A = Object.prototype.toString;
	tab._jQueryShim.$B = new RegExp('^[\\s\\xA0]+');
	tab._jQueryShim.$C = new RegExp('[\\s\\xA0]+$');
	tab._jQueryShim.$D = new RegExp('^[\\],:{}\\s]*$');
	tab._jQueryShim.$E = new RegExp('\\\\(?:["\\\\\\/bfnrt]|u[0-9a-fA-F]{4})', 'g');
	tab._jQueryShim.$F = new RegExp('"[^"\\\\\\n\\r]*"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?', 'g');
	tab._jQueryShim.$10 = new RegExp('(?:^|:|,)(?:\\s*\\[)+', 'g');
	tableauSoftware.Promise = tab._PromiseImpl;
	tab._Deferred = tab._DeferredImpl;
	tab._Collection = tab._CollectionImpl;
	tableauSoftware.DashboardObjectType = {
		BLANK: 'blank',
		WORKSHEET: 'worksheet',
		QUICK_FILTER: 'quickFilter',
		PARAMETER_CONTROL: 'parameterControl',
		PAGE_FILTER: 'pageFilter',
		LEGEND: 'legend',
		TITLE: 'title',
		TEXT: 'text',
		IMAGE: 'image',
		WEB_PAGE: 'webPage'
	};
	tableauSoftware.FilterType = {
		CATEGORICAL: 'categorical',
		QUANTITATIVE: 'quantitative',
		HIERARCHICAL: 'hierarchical',
		RELATIVEDATE: 'relativedate'
	};
	tableauSoftware.ParameterDataType = {
		FLOAT: 'float',
		INTEGER: 'integer',
		STRING: 'string',
		BOOLEAN: 'boolean',
		DATE: 'date',
		DATETIME: 'datetime'
	};
	tableauSoftware.ParameterAllowableValuesType = {
		ALL: 'all',
		LIST: 'list',
		RANGE: 'range'
	};
	tableauSoftware.PeriodType = {
		YEAR: 'year',
		QUARTER: 'quarter',
		MONTH: 'month',
		WEEK: 'week',
		DAY: 'day',
		HOUR: 'hour',
		MINUTE: 'minute',
		SECOND: 'second'
	};
	tableauSoftware.DateRangeType = {
		LAST: 'last',
		LASTN: 'lastn',
		NEXT: 'next',
		NEXTN: 'nextn',
		CURR: 'curr',
		TODATE: 'todate'
	};
	tableauSoftware.SheetSizeBehavior = {
		AUTOMATIC: 'automatic',
		EXACTLY: 'exactly',
		RANGE: 'range',
		ATLEAST: 'atleast',
		ATMOST: 'atmost'
	};
	tableauSoftware.SheetType = {
		WORKSHEET: 'worksheet',
		DASHBOARD: 'dashboard',
		STORY: 'story'
	};
	tableauSoftware.FilterUpdateType = {
		ALL: 'all',
		REPLACE: 'replace',
		ADD: 'add',
		REMOVE: 'remove'
	};
	tableauSoftware.SelectionUpdateType = {
		REPLACE: 'replace',
		ADD: 'add',
		REMOVE: 'remove'
	};
	tableauSoftware.NullOption = {
		NULL_VALUES: 'nullValues',
		NON_NULL_VALUES: 'nonNullValues',
		ALL_VALUES: 'allValues'
	};
	tableauSoftware.ErrorCode = {
		INTERNAL_ERROR: 'internalError',
		SERVER_ERROR: 'serverError',
		INVALID_AGGREGATION_FIELD_NAME: 'invalidAggregationFieldName',
		INVALID_PARAMETER: 'invalidParameter',
		INVALID_URL: 'invalidUrl',
		STALE_DATA_REFERENCE: 'staleDataReference',
		VIZ_ALREADY_IN_MANAGER: 'vizAlreadyInManager',
		NO_URL_OR_PARENT_ELEMENT_NOT_FOUND: 'noUrlOrParentElementNotFound',
		INVALID_FILTER_FIELDNAME: 'invalidFilterFieldName',
		INVALID_FILTER_FIELDVALUE: 'invalidFilterFieldValue',
		INVALID_FILTER_FIELDNAME_OR_VALUE: 'invalidFilterFieldNameOrValue',
		FILTER_CANNOT_BE_PERFORMED: 'filterCannotBePerformed',
		NOT_ACTIVE_SHEET: 'notActiveSheet',
		INVALID_CUSTOM_VIEW_NAME: 'invalidCustomViewName',
		MISSING_RANGEN_FOR_RELATIVE_DATE_FILTERS: 'missingRangeNForRelativeDateFilters',
		MISSING_MAX_SIZE: 'missingMaxSize',
		MISSING_MIN_SIZE: 'missingMinSize',
		MISSING_MINMAX_SIZE: 'missingMinMaxSize',
		INVALID_SIZE: 'invalidSize',
		INVALID_SIZE_BEHAVIOR_ON_WORKSHEET: 'invalidSizeBehaviorOnWorksheet',
		SHEET_NOT_IN_WORKBOOK: 'sheetNotInWorkbook',
		INDEX_OUT_OF_RANGE: 'indexOutOfRange',
		DOWNLOAD_WORKBOOK_NOT_ALLOWED: 'downloadWorkbookNotAllowed',
		NULL_OR_EMPTY_PARAMETER: 'nullOrEmptyParameter',
		BROWSER_NOT_CAPABLE: 'browserNotCapable',
		UNSUPPORTED_EVENT_NAME: 'unsupportedEventName',
		INVALID_DATE_PARAMETER: 'invalidDateParameter',
		INVALID_SELECTION_FIELDNAME: 'invalidSelectionFieldName',
		INVALID_SELECTION_VALUE: 'invalidSelectionValue',
		INVALID_SELECTION_DATE: 'invalidSelectionDate',
		NO_URL_FOR_HIDDEN_WORKSHEET: 'noUrlForHiddenWorksheet'
	};
	tableauSoftware.TableauEventName = {
		CUSTOM_VIEW_LOAD: 'customviewload',
		CUSTOM_VIEW_REMOVE: 'customviewremove',
		CUSTOM_VIEW_SAVE: 'customviewsave',
		CUSTOM_VIEW_SET_DEFAULT: 'customviewsetdefault',
		FILTER_CHANGE: 'filterchange',
		FIRST_INTERACTIVE: 'firstinteractive',
		MARKS_SELECTION: 'marksselection',
		PARAMETER_VALUE_CHANGE: 'parametervaluechange',
		STORY_POINT_SWITCH: 'storypointswitch',
		TAB_SWITCH: 'tabswitch'
	};
	tableauSoftware.FieldRoleType = {
		DIMENSION: 'dimension',
		MEASURE: 'measure',
		UNKNOWN: 'unknown'
	};
	tableauSoftware.FieldAggregationType = {
		SUM: 'SUM',
		AVG: 'AVG',
		MIN: 'MIN',
		MAX: 'MAX',
		STDEV: 'STDEV',
		STDEVP: 'STDEVP',
		VAR: 'VAR',
		VARP: 'VARP',
		COUNT: 'COUNT',
		COUNTD: 'COUNTD',
		MEDIAN: 'MEDIAN',
		ATTR: 'ATTR',
		NONE: 'NONE',
		YEAR: 'YEAR',
		QTR: 'QTR',
		MONTH: 'MONTH',
		DAY: 'DAY',
		HOUR: 'HOUR',
		MINUTE: 'MINUTE',
		SECOND: 'SECOND',
		WEEK: 'WEEK',
		WEEKDAY: 'WEEKDAY',
		MONTHYEAR: 'MONTHYEAR',
		MDY: 'MDY',
		END: 'END',
		TRUNC_YEAR: 'TRUNC_YEAR',
		TRUNC_QTR: 'TRUNC_QTR',
		TRUNC_MONTH: 'TRUNC_MONTH',
		TRUNC_WEEK: 'TRUNC_WEEK',
		TRUNC_DAY: 'TRUNC_DAY',
		TRUNC_HOUR: 'TRUNC_HOUR',
		TRUNC_MINUTE: 'TRUNC_MINUTE',
		TRUNC_SECOND: 'TRUNC_SECOND',
		QUART1: 'QUART1',
		QUART3: 'QUART3',
		SKEWNESS: 'SKEWNESS',
		KURTOSIS: 'KURTOSIS',
		INOUT: 'INOUT',
		SUM_XSQR: 'SUM_XSQR',
		USER: 'USER'
	};
	tableauSoftware.ToolbarPosition = {
		TOP: 'top',
		BOTTOM: 'bottom'
	};
	restoreTypeSystem();
	tab._ApiBootstrap.initialize();
})();