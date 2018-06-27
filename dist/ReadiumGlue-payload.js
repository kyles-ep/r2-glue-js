var ReadiumGlue = (function (exports) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    // tslint:disable
    /**
     * Returns a random v4 UUID
     * See {@link https://gist.github.com/jed/982883}.
     * @param [a] This is to not be used.
     * @returns {string}
     */
    function uuid(a) {
        if (a === void 0) { a = undefined; }
        return a
            ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
            : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
    }
    // tslint:enable

    var PROTOCOL_NAME = 'r2-glue-js';
    var PROTOCOL_VERSION = '1.0.0';
    var Message = /** @class */ (function () {
        function Message(namespace, type, parameters, correlationId) {
            this.namespace = namespace;
            this.type = type;
            this.parameters = parameters;
            this.correlationId = correlationId || uuid();
            this.protocol = PROTOCOL_NAME;
            this.version = PROTOCOL_VERSION;
        }
        Message.validate = function (message) {
            return !!message.protocol && message.protocol === PROTOCOL_NAME;
        };
        return Message;
    }());

    var Receiver = /** @class */ (function () {
        function Receiver(namespace) {
            var _this = this;
            window.addEventListener('message', function (event) {
                var request = event.data;
                if (!Message.validate(request) || request.namespace !== namespace) {
                    return;
                }
                _this.processMessage(request, function (type, parameters) {
                    if (!event.source) {
                        return;
                    }
                    event.source.postMessage(new Message(namespace, type, parameters, request.correlationId), event.origin);
                });
            }, false);
        }
        return Receiver;
    }());

    var Dispatcher = /** @class */ (function (_super) {
        __extends(Dispatcher, _super);
        function Dispatcher(namespace, handlerType) {
            var _this = _super.call(this, namespace) || this;
            _this._handler = new handlerType();
            return _this;
        }
        Dispatcher.prototype.processMessage = function (message, sendMessage) {
            this._handler[message.type].apply(this, [
                function () {
                    var responseParams = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        responseParams[_i] = arguments[_i];
                    }
                    sendMessage(message.type + "$response", responseParams);
                }
            ].concat(message.parameters));
        };
        return Dispatcher;
    }(Receiver));

    var MessageHandler = /** @class */ (function () {
        function MessageHandler() {
        }
        return MessageHandler;
    }());

    var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    /*! https://mths.be/cssesc v1.0.1 by @mathias */

    const object = {};
    const hasOwnProperty = object.hasOwnProperty;
    const merge = (options, defaults) => {
    	if (!options) {
    		return defaults;
    	}
    	const result = {};
    	for (let key in defaults) {
    		// `if (defaults.hasOwnProperty(key) { … }` is not needed here, since
    		// only recognized option names are used.
    		result[key] = hasOwnProperty.call(options, key)
    			? options[key]
    			: defaults[key];
    	}
    	return result;
    };

    const regexAnySingleEscape = /[ -,\.\/;-@\[-\^`\{-~]/;
    const regexSingleEscape = /[ -,\.\/;-@\[\]\^`\{-~]/;
    const regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;

    // https://mathiasbynens.be/notes/css-escapes#css
    const cssesc = (string, options) => {
    	options = merge(options, cssesc.options);
    	if (options.quotes != 'single' && options.quotes != 'double') {
    		options.quotes = 'single';
    	}
    	const quote = options.quotes == 'double' ? '"' : '\'';
    	const isIdentifier = options.isIdentifier;

    	const firstChar = string.charAt(0);
    	let output = '';
    	let counter = 0;
    	const length = string.length;
    	while (counter < length) {
    		const character = string.charAt(counter++);
    		let codePoint = character.charCodeAt();
    		let value;
    		// If it’s not a printable ASCII character…
    		if (codePoint < 0x20 || codePoint > 0x7E) {
    			if (codePoint >= 0xD800 && codePoint <= 0xDBFF && counter < length) {
    				// It’s a high surrogate, and there is a next character.
    				const extra = string.charCodeAt(counter++);
    				if ((extra & 0xFC00) == 0xDC00) { // next character is low surrogate
    					codePoint = ((codePoint & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
    				} else {
    					// It’s an unmatched surrogate; only append this code unit, in case
    					// the next code unit is the high surrogate of a surrogate pair.
    					counter--;
    				}
    			}
    			value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
    		} else {
    			if (options.escapeEverything) {
    				if (regexAnySingleEscape.test(character)) {
    					value = '\\' + character;
    				} else {
    					value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
    				}
    			// Note: `:` could be escaped as `\:`, but that fails in IE < 8.
    			} else if (/[\t\n\f\r\x0B:]/.test(character)) {
    				if (!isIdentifier && character == ':') {
    					value = character;
    				} else {
    					value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
    				}
    			} else if (
    				character == '\\' ||
    				(
    					!isIdentifier &&
    					(
    						(character == '"' && quote == character) ||
    						(character == '\'' && quote == character)
    					)
    				) ||
    				(isIdentifier && regexSingleEscape.test(character))
    			) {
    				value = '\\' + character;
    			} else {
    				value = character;
    			}
    		}
    		output += value;
    	}

    	if (isIdentifier) {
    		if (/^_/.test(output)) {
    			// Prevent IE6 from ignoring the rule altogether (in case this is for an
    			// identifier used as a selector)
    			output = '\\_' + output.slice(1);
    		} else if (/^-[-\d]/.test(output)) {
    			output = '\\-' + output.slice(1);
    		} else if (/\d/.test(firstChar)) {
    			output = '\\3' + firstChar + ' ' + output.slice(1);
    		}
    	}

    	// Remove spaces after `\HEX` escapes that are not followed by a hex digit,
    	// since they’re redundant. Note that this is only possible if the escape
    	// sequence isn’t preceded by an odd number of backslashes.
    	output = output.replace(regexExcessiveSpaces, function($0, $1, $2) {
    		if ($1 && $1.length % 2) {
    			// It’s not safe to remove the space, so don’t.
    			return $0;
    		}
    		// Strip the space.
    		return ($1 || '') + $2;
    	});

    	if (!isIdentifier && options.wrap) {
    		return quote + output + quote;
    	}
    	return output;
    };

    // Expose default options (so they can be overridden globally).
    cssesc.options = {
    	'escapeEverything': false,
    	'isIdentifier': false,
    	'quotes': 'single',
    	'wrap': false
    };

    cssesc.version = '1.0.1';

    var cssesc_1 = cssesc;

    var dist = createCommonjsModule(function (module, exports) {
    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [0, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    };
    Object.defineProperty(exports, "__esModule", { value: true });

    var Limit;
    (function (Limit) {
        Limit[Limit["All"] = 0] = "All";
        Limit[Limit["Two"] = 1] = "Two";
        Limit[Limit["One"] = 2] = "One";
    })(Limit || (Limit = {}));
    var config;
    function default_1(input, options) {
        if (input.nodeType !== Node.ELEMENT_NODE) {
            throw new Error("Can't generate CSS selector for non-element node type.");
        }
        if ('html' === input.tagName.toLowerCase()) {
            return input.tagName.toLowerCase();
        }
        var defaults = {
            root: document.body,
            className: function (name) { return true; },
            tagName: function (name) { return true; },
            seedMinLength: 1,
            optimizedMinLength: 2,
            threshold: 1000,
        };
        config = __assign({}, defaults, options);
        var path = bottomUpSearch(input, Limit.All, function () {
            return bottomUpSearch(input, Limit.Two, function () {
                return bottomUpSearch(input, Limit.One);
            });
        });
        if (path) {
            var optimized = sort(optimize(path, input));
            if (optimized.length > 0) {
                path = optimized[0];
            }
            return selector(path);
        }
        else {
            throw new Error("Selector was not found.");
        }
    }
    exports.default = default_1;
    function bottomUpSearch(input, limit, fallback) {
        var path = null;
        var stack = [];
        var current = input;
        var i = 0;
        var _loop_1 = function () {
            var level = maybe(id(current)) || maybe.apply(void 0, classNames(current)) || maybe(tagName(current)) || [any()];
            var nth = index(current);
            if (limit === Limit.All) {
                if (nth) {
                    level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
                }
            }
            else if (limit === Limit.Two) {
                level = level.slice(0, 1);
                if (nth) {
                    level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
                }
            }
            else if (limit === Limit.One) {
                var node = (level = level.slice(0, 1))[0];
                if (nth && dispensableNth(node)) {
                    level = [nthChild(node, nth)];
                }
            }
            for (var _i = 0, level_1 = level; _i < level_1.length; _i++) {
                var node = level_1[_i];
                node.level = i;
            }
            stack.push(level);
            if (stack.length >= config.seedMinLength) {
                path = findUniquePath(stack, fallback);
                if (path) {
                    return "break";
                }
            }
            current = current.parentElement;
            i++;
        };
        while (current && current !== config.root.parentElement) {
            var state_1 = _loop_1();
            if (state_1 === "break")
                break;
        }
        if (!path) {
            path = findUniquePath(stack, fallback);
        }
        return path;
    }
    function findUniquePath(stack, fallback) {
        var paths = sort(combinations(stack));
        if (paths.length > config.threshold) {
            return fallback ? fallback() : null;
        }
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var candidate = paths_1[_i];
            if (unique(candidate)) {
                return candidate;
            }
        }
        return null;
    }
    function selector(path) {
        var node = path[0];
        var query = node.name;
        for (var i = 1; i < path.length; i++) {
            var level = path[i].level || 0;
            if (node.level === level - 1) {
                query = path[i].name + " > " + query;
            }
            else {
                query = path[i].name + " " + query;
            }
            node = path[i];
        }
        return query;
    }
    function penalty(path) {
        return path.map(function (node) { return node.penalty; }).reduce(function (acc, i) { return acc + i; }, 0);
    }
    function unique(path) {
        switch (document.querySelectorAll(selector(path)).length) {
            case 0:
                throw new Error("Can't select any node with this selector: " + selector(path));
            case 1:
                return true;
            default:
                return false;
        }
    }
    function id(input) {
        if (input.id !== '') {
            return {
                name: '#' + cssesc_1(input.id, { isIdentifier: true }),
                penalty: 0,
            };
        }
        return null;
    }
    function classNames(input) {
        var names = Array.from(input.classList)
            .filter(config.className);
        return names.map(function (name) { return ({
            name: '.' + cssesc_1(name, { isIdentifier: true }),
            penalty: 1
        }); });
    }
    function tagName(input) {
        var name = input.tagName.toLowerCase();
        if (config.tagName(name)) {
            return {
                name: name,
                penalty: 2
            };
        }
        return null;
    }
    function any() {
        return {
            name: '*',
            penalty: 3
        };
    }
    function index(input) {
        var parent = input.parentNode;
        if (!parent) {
            return null;
        }
        var child = parent.firstChild;
        if (!child) {
            return null;
        }
        var i = 0;
        while (true) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                i++;
            }
            if (child === input || !child.nextSibling) {
                break;
            }
            child = child.nextSibling;
        }
        return i;
    }
    function nthChild(node, i) {
        return {
            name: node.name + (":nth-child(" + i + ")"),
            penalty: node.penalty + 1
        };
    }
    function dispensableNth(node) {
        return node.name !== 'html' && !node.name.startsWith('#');
    }
    function maybe() {
        var level = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            level[_i] = arguments[_i];
        }
        var list = level.filter(notEmpty);
        if (list.length > 0) {
            return list;
        }
        return null;
    }
    function notEmpty(value) {
        return value !== null && value !== undefined;
    }
    function combinations(stack, path) {
        if (path === void 0) { path = []; }
        var _i, _a, node;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(stack.length > 0)) return [3 /*break*/, 5];
                    _i = 0, _a = stack[0];
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    node = _a[_i];
                    return [5 /*yield**/, __values(combinations(stack.slice(1, stack.length), path.concat(node)))];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, path];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }
    function sort(paths) {
        return Array.from(paths).sort(function (a, b) { return penalty(a) - penalty(b); });
    }
    function optimize(path, input) {
        var i, newPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(path.length > 2 && path.length > config.optimizedMinLength)) return [3 /*break*/, 5];
                    i = 1;
                    _a.label = 1;
                case 1:
                    if (!(i < path.length - 1)) return [3 /*break*/, 5];
                    newPath = path.slice();
                    newPath.splice(i, 1);
                    if (!(unique(newPath) && same(newPath, input))) return [3 /*break*/, 4];
                    return [4 /*yield*/, newPath];
                case 2:
                    _a.sent();
                    return [5 /*yield**/, __values(optimize(newPath, input))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    }
    function same(path, input) {
        return document.querySelector(selector(path)) === input;
    }

    });

    var finder = unwrapExports(dist);

    var EventHandlingMessage;
    (function (EventHandlingMessage) {
        EventHandlingMessage["AddEventListener"] = "ADD_EVENT_LISTENER";
    })(EventHandlingMessage || (EventHandlingMessage = {}));

    var EventHandler = /** @class */ (function (_super) {
        __extends(EventHandler, _super);
        function EventHandler() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EventHandler.prototype[EventHandlingMessage.AddEventListener] = function (callback, target, eventType, properties, options) {
            var eventTargets;
            if (target === '@window') {
                eventTargets = [window];
            }
            else if (target === '@document') {
                eventTargets = [document];
            }
            else {
                eventTargets = document.querySelectorAll(target);
            }
            if (eventTargets && eventTargets.length) {
                Array.prototype.forEach.call(eventTargets, function (resolvedTarget) {
                    resolvedTarget.addEventListener(eventType, function (event) {
                        if (options.preventDefault) {
                            event.preventDefault();
                        }
                        if (options.stopPropagation) {
                            event.stopPropagation();
                        }
                        if (options.stopImmediatePropagation) {
                            event.stopImmediatePropagation();
                        }
                        var pluckedEventArgs = {};
                        properties.forEach(function (key) {
                            pluckedEventArgs[key] = event[key];
                        });
                        callback(JSON.parse(JSON.stringify(pluckedEventArgs, function (key, value) {
                            if (value instanceof Window) {
                                return '@window';
                            }
                            if (value instanceof Document) {
                                return '@document';
                            }
                            if (value instanceof Node) {
                                // Generate a CSS selector for the Node
                                return finder(value);
                            }
                            return value;
                        })));
                    });
                });
            }
        };
        return EventHandler;
    }(MessageHandler));

    var index = new Dispatcher('event-handling', EventHandler);

    exports.eventHandling = index;

    return exports;

}({}));
//# sourceMappingURL=ReadiumGlue-payload.js.map