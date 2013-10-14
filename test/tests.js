(function() {

    /**
     * Normalizes line endings by removing all \r (carriage return) characters.
     * In IE, newlines in textareas are stored as \r\n instead of just \n, which screws up length calculations.
     * All other browsers automatically remove \r characters when you set the value of the textarea.
     * @returns {string}
     */
    String.prototype.norm = function() {
        return this.replace(/\r/g, '');
    };

    pavlov.specify.extendAssertions({
        /**
         * Asserts that the actual value is one of the given expected values.
         * @param {*} actual Actual value
         * @param {*[]} expected Array of expected values to search
         * @param {String} message Message to display if the assertion fails
         */
        isOneOf: function(actual, expected, message) {
            ok(expected.indexOf(actual) !== -1, message);
        },

        /**
         * Asserts that the actual {@link Range} has a length of zero (0), empty text (''), equal start/end positions,
         * and a start/end position that matches one of the expected start/end positions.
         * @param {Range} actual
         * @param {Number} length Length of the input/textarea's value
         * @param {String} message Message to display if the assertion fails
         */
        isEmptyRange: function(actual, length, message) {
            ok(actual.length === 0, message);
            ok(actual.text === '', message);
            ok(actual.start === actual.end, message);
            ok([ 0, length ].indexOf(actual.start) !== -1, message);
        }
    });

    pavlov.specify('jQuery Caret Plugin', function() {

        var _e = function(tagName) {
            return document.createElement(tagName);
        };

        var _s = function(obj) {
            return JSON.stringify(obj, null, '    ');
        };

        var _support = {
            normalizesNewlines: (function() {
                var textarea = _e('textarea');
                textarea.value = '\r\n';
                return textarea.value === '\n';
            }())
        };

        var $fixture = $('#qunit-fixture');

        var _single = 'abcdefghijklmnop',
            _multi = 'abcd\r\nefg\r\nhijk\r\nlm',
            _short = 'abc',
            _long = 'abcdefghijklmnopqrstuvwxyz',
            _empty = '';

        describe('All Plugins', function() {
            var $input, $textarea;

            // befores and afters:

            before(function() {
                $input = $('<input/>').appendTo($fixture);
                $textarea = $('<textarea/>').appendTo($fixture);
            });

            // plugins:

            describe('Caret', function() {
                describe('Get', function() {
                    // Note: Every browser handles automatic caret placement a little differently,
                    // which means our tests need to accommodate both placement strategies
                    // (at the beginning and end of the input/textarea).

                    it("Returns undefined when the jQuery object does not contain an input or textarea element", function() {
                        assert($().caret()).isUndefined();
                        assert($({}).caret()).isUndefined();
                        assert($('<div/>').caret()).isUndefined();
                        assert($([ _e('span'), _e('div'), _e('button') ]).caret()).isUndefined();
                    });

                    it("Returns the caret position of the first input element in the jQuery object", function() {
                        var span = _e('span'),
                            div = _e('div'),
                            button = _e('button');

                        $input.val('abcdef').caret(3);
                        assert($([ span, div, button, $input[0] ]).caret()).equals(3);

                        $textarea.val('abcdef').caret(3);
                        assert($([ span, div, button, $textarea[0] ]).caret()).equals(3);
                    });

                    it("Returns zero (0) when no value has been set", function() {
                        assert($input.caret()).equals(0);

                        assert($textarea.caret()).equals(0);
                    });

                    it("Returns zero (0) or value.length when a value has been set", function() {
                        // In IE and FF, the caret remains at index 0 the first time a value is set;
                        // the second time a value is set, the caret moves to the end of the input/textarea.

                        assert($input.val(_single).caret()).isOneOf([ 0, _single.length ]);
                        assert($input.val(_single).caret()).isOneOf([ 0, _single.length ]);

                        assert($textarea.val(_multi).caret()).isOneOf([ 0, _multi.norm().length ]);
                        assert($textarea.val(_multi).caret()).isOneOf([ 0, _multi.norm().length ]);
                    });

                    it("Returns zero (0) or value.length when the input's value changes", function() {
                        assert($input.val(_short).caret()).isOneOf([ 0, _short.length ]);
                        assert($input.val(_long).caret()).isOneOf([ 0, _long.length ]);
                        assert($input.val(_short).caret()).isOneOf([ 0, _short.length ]);
                        assert($input.val(_empty).caret()).isOneOf([ 0, _empty.length ]);

                        assert($textarea.val(_short).caret()).isOneOf([ 0, _short.length ]);
                        assert($textarea.val(_long).caret()).isOneOf([ 0, _long.length ]);
                        assert($textarea.val(_short).caret()).isOneOf([ 0, _short.length ]);
                        assert($textarea.val(_empty).caret()).isOneOf([ 0, _empty.length ]);
                    });
                });

                describe('Set', function() {
                    describe('<input>', function() {
                        var text = _single,
                            len = text.length,
                            mid = Math.floor(len / 2);

                        it("Gets the same position that was set", function() {
                            assert($input.val(text).caret(0).caret()).equals(0);
                            assert($input.val(text).caret(1).caret()).equals(1);
                            assert($input.val(text).caret(2).caret()).equals(2);
                            assert($input.val(text).caret(mid - 2).caret()).equals(mid - 2);
                            assert($input.val(text).caret(mid - 1).caret()).equals(mid - 1);
                            assert($input.val(text).caret(mid).caret()).equals(mid);
                            assert($input.val(text).caret(mid + 1).caret()).equals(mid + 1);
                            assert($input.val(text).caret(mid + 2).caret()).equals(mid + 2);
                            assert($input.val(text).caret(len - 2).caret()).equals(len - 2);
                            assert($input.val(text).caret(len - 1).caret()).equals(len - 1);
                            assert($input.val(text).caret(len).caret()).equals(len);
                        });

                        it("Enforces length boundary", function() {
                            assert($input.val(text).caret(len + 1).caret()).equals(len);
                            assert($input.val(text).caret(len + 2).caret()).equals(len);
                        });

                        it("Allows negative position", function() {
                            assert($input.val(text).caret(-1).caret()).equals(len - 1);
                            assert($input.val(text).caret(-2).caret()).equals(len - 2);
                        });

                        it("Converts floating point values to integers", function() {
                            assert($input.val(text).caret(1.5).caret()).equals(1.0);
                            assert($input.val(text).caret(2.5).caret()).equals(2.0);
                        });
                    });

                    describe('<textarea>', function() {
                        var text = _multi,
                            len = text.norm().length,
                            nl1 = text.norm().indexOf('\n'),
                            nl2 = text.norm().lastIndexOf('\n');

                        it("Gets the same position that was set", function() {
                            assert($textarea.val(text).caret(0).caret()).equals(0);
                            assert($textarea.val(text).caret(1).caret()).equals(1);
                            assert($textarea.val(text).caret(2).caret()).equals(2);

                            assert($textarea.val(text).caret(nl1 - 2).caret()).equals(nl1 - 2);
                            assert($textarea.val(text).caret(nl1 - 1).caret()).equals(nl1 - 1);
                            assert($textarea.val(text).caret(nl1).caret()).equals(nl1);
                            assert($textarea.val(text).caret(nl1 + 1).caret()).equals(nl1 + 1);
                            assert($textarea.val(text).caret(nl1 + 2).caret()).equals(nl1 + 2);

                            assert($textarea.val(text).caret(nl2 - 2).caret()).equals(nl2 - 2);
                            assert($textarea.val(text).caret(nl2 - 1).caret()).equals(nl2 - 1);
                            assert($textarea.val(text).caret(nl2).caret()).equals(nl2);
                            assert($textarea.val(text).caret(nl2 + 1).caret()).equals(nl2 + 1);
                            assert($textarea.val(text).caret(nl2 + 2).caret()).equals(nl2 + 2);

                            assert($textarea.val(text).caret(len - 7).caret()).equals(len - 7);
                            assert($textarea.val(text).caret(len - 6).caret()).equals(len - 6);
                            assert($textarea.val(text).caret(len - 5).caret()).equals(len - 5);
                            assert($textarea.val(text).caret(len - 4).caret()).equals(len - 4);
                            assert($textarea.val(text).caret(len - 3).caret()).equals(len - 3);
                            assert($textarea.val(text).caret(len - 2).caret()).equals(len - 2);
                            assert($textarea.val(text).caret(len - 1).caret()).equals(len - 1);
                            assert($textarea.val(text).caret(len).caret()).equals(len);
                        });

                        it("Enforces length boundary", function() {
                            assert($textarea.val(text).caret(len + 1).caret()).equals(len);
                            assert($textarea.val(text).caret(len + 2).caret()).equals(len);
                        });

                        it("Allows negative position", function() {
                            assert($textarea.val(text).caret(-1).caret()).equals(len - 1);
                            assert($textarea.val(text).caret(-2).caret()).equals(len - 2);
                        });

                        it("Converts floating point values to integers", function() {
                            assert($textarea.val(text).caret(1.5).caret()).equals(1);
                            assert($textarea.val(text).caret(2.5).caret()).equals(2);
                        });
                    });
                });

                describe('Insert', function() {
                    it("Prepends text", function() {
                        assert($input.val('abc').caret(0).caret('123').val()).equals('123abc');

                        assert($textarea.val('abc\ndef').caret(0).caret('123').val()).equals('123abc\ndef');
                    });

                    it("Appends text", function() {
                        assert($input.val('abc').caret(3).caret('123').val()).equals('abc123');

                        assert($textarea.val('abc\ndef').caret(7).caret('123').val()).equals('abc\ndef123');
                        assert($textarea.val('abc\ndef').caret(8).caret('123').val()).equals('abc\ndef123');
                    });

                    it("Inserts text", function() {
                        assert($input.val('abcdef').caret(3).caret('123').val()).equals('abc123def');

                        assert($textarea.val('abc\ndef').caret(3).caret('123').val()).equals('abc123\ndef');
                        assert($textarea.val('abc\ndef').caret(4).caret('123').val()).equals('abc\n123def');
                    });

                    it("Respects maxlength attribute", function() {
                        $input.attr('maxlength', 5);
                        assert($input.val('abc').caret(0).caret('123').val()).equals('12abc');
                        assert($input.val('abc').caret(3).caret('123').val()).equals('abc12');
                        assert($input.val('abcde').caret(0).caret('123').val()).equals('abcde');
                        assert($input.val('abcde').caret(3).caret('123').val()).equals('abcde');
                        assert($input.val('abcde').caret(5).caret('123').val()).equals('abcde');

                        $textarea.attr('maxlength', 9);
                        assert($textarea.val('abc\ndef').caret(0).caret('123').val()).equals('12abc\ndef');
                        assert($textarea.val('abc\ndef').caret(3).caret('123').val()).equals('abc12\ndef');
                        assert($textarea.val('abc\ndef').caret(4).caret('123').val()).equals('abc\n12def');
                        assert($textarea.val('abc\ndef\ng').caret(0).caret('123').val()).equals('abc\ndef\ng');
                        assert($textarea.val('abc\ndef\ng').caret(3).caret('123').val()).equals('abc\ndef\ng');
                        assert($textarea.val('abc\ndef\ng').caret(5).caret('123').val()).equals('abc\ndef\ng');
                    });

                    it("Sets the caret position after inserting text", function() {
                        $input.attr('maxlength', 5);
                        assert($input.val('').caret(0).caret('123').caret()).equals(3);
                        assert($input.val('abc').caret(0).caret('12').caret()).equals(2);
                        assert($input.val('abc').caret(1).caret('12').caret()).equals(3);
                        assert($input.val('abc').caret(3).caret('1').caret()).equals(4);
                        assert($input.val('abc').caret(0).caret('123').caret()).equals(2);
                        assert($input.val('abc').caret(3).caret('123').caret()).equals(5);
                        assert($input.val('abcde').caret(0).caret('123').caret()).equals(0);
                        assert($input.val('abcde').caret(3).caret('123').caret()).equals(3);
                        assert($input.val('abcde').caret(5).caret('123').caret()).equals(5);

                        $textarea.attr('maxlength', 9);
                        assert($textarea.val('').caret(0).caret('123').caret()).equals(3);
                        assert($textarea.val('abc\ndef').caret(0).caret('12').caret()).equals(2);
                        assert($textarea.val('abc\ndef').caret(1).caret('12').caret()).equals(3);
                        assert($textarea.val('abc\ndef').caret(3).caret('1').caret()).equals(4);
                        assert($textarea.val('abc\ndef').caret(0).caret('123').caret()).equals(2);
                        assert($textarea.val('abc\ndef').caret(3).caret('123').caret()).equals(5);
                        assert($textarea.val('abc\ndef').caret(4).caret('123').caret()).equals(6);
                        assert($textarea.val('abc\ndef\ng').caret(0).caret('123').caret()).equals(0);
                        assert($textarea.val('abc\ndef\ng').caret(3).caret('123').caret()).equals(3);
                        assert($textarea.val('abc\ndef\ng').caret(5).caret('123').caret()).equals(5);
                    });
                });
            });

            describe('Range', function() {
                describe('Get', function() {
                    it("Returns undefined when the jQuery object does not contain an input or textarea element", function() {
                        assert($().range()).isUndefined();
                        assert($({}).range()).isUndefined();
                        assert($('<div/>').range()).isUndefined();
                        assert($([ _e('span'), _e('div'), _e('button') ]).range()).isUndefined();
                    });

                    it("Returns the selected range of the first input element in the jQuery object", function() {
                        var span = _e('span'),
                            div = _e('div'),
                            button = _e('button');

                        $input.val('abcdef').range(3, 5);
                        assert(_s($([ span, div, button, $input[0] ]).range())).equals(_s({ start: 3, end: 5, length: 2, text: 'de' }));

                        $textarea.val('abcdef').range(3, 5);
                        assert(_s($([ span, div, button, $textarea[0] ]).range())).equals(_s({ start: 3, end: 5, length: 2, text: 'de' }));
                    });

                    it("Returns zero (0) start/end/length and empty ('') text when no value has been set", function() {
                        assert(_s($input.range())).equals(_s({ start: 0, end: 0, length: 0, text: '' }));

                        assert(_s($textarea.range())).equals(_s({ start: 0, end: 0, length: 0, text: '' }));
                    });

                    it("Returns zero (0) or value.length when a value has been set", function() {
                        // In IE and FF, the caret remains at index 0 the first time a value is set;
                        // the second time a value is set, the caret moves to the end of the input/textarea.

                        assert($input.val('abcdef').range()).isEmptyRange(6);
                        assert($input.val('abcdef').range()).isEmptyRange(6);

                        assert($textarea.val('abc\ndef').range()).isEmptyRange(7);
                        assert($textarea.val('abc\ndef').range()).isEmptyRange(7);
                    });

                    it("Returns zero (0) or value.length when the input's value changes", function() {
                        assert($input.val(_short).range()).isEmptyRange(_short.length);
                        assert($input.val(_long).range()).isEmptyRange(_long.length);
                        assert($input.val(_short).range()).isEmptyRange(_short.length);
                        assert($input.val(_empty).range()).isEmptyRange(_empty.length);

                        assert($textarea.val(_short).range()).isEmptyRange(_short.length);
                        assert($textarea.val(_long).range()).isEmptyRange(_long.length);
                        assert($textarea.val(_short).range()).isEmptyRange(_short.length);
                        assert($textarea.val(_empty).range()).isEmptyRange(_empty.length);
                    });

                    it("Handles zero-length selections", function() {
                        assert(_s($input.val('abcdef').range(0, 0).range())).equals(_s({ start: 0, end: 0, length: 0, text: '' }));
                        assert(_s($input.val('abcdef').range(1, 1).range())).equals(_s({ start: 1, end: 1, length: 0, text: '' }));
                        assert(_s($input.val('abcdef').range(2, 2).range())).equals(_s({ start: 2, end: 2, length: 0, text: '' }));
                        assert(_s($input.val('abcdef').range(3, 3).range())).equals(_s({ start: 3, end: 3, length: 0, text: '' }));
                        assert(_s($input.val('abcdef').range(4, 4).range())).equals(_s({ start: 4, end: 4, length: 0, text: '' }));
                        assert(_s($input.val('abcdef').range(5, 5).range())).equals(_s({ start: 5, end: 5, length: 0, text: '' }));
                        assert(_s($input.val('abcdef').range(6, 6).range())).equals(_s({ start: 6, end: 6, length: 0, text: '' }));

                        assert(_s($textarea.val('abc\ndef').range(0, 0).range())).equals(_s({ start: 0, end: 0, length: 0, text: '' }));
                        assert(_s($textarea.val('abc\ndef').range(1, 1).range())).equals(_s({ start: 1, end: 1, length: 0, text: '' }));
                        assert(_s($textarea.val('abc\ndef').range(3, 3).range())).equals(_s({ start: 3, end: 3, length: 0, text: '' }));
                        assert(_s($textarea.val('abc\ndef').range(4, 4).range())).equals(_s({ start: 4, end: 4, length: 0, text: '' }));
                        assert(_s($textarea.val('abc\ndef').range(5, 5).range())).equals(_s({ start: 5, end: 5, length: 0, text: '' }));
                        assert(_s($textarea.val('abc\ndef').range(7, 7).range())).equals(_s({ start: 7, end: 7, length: 0, text: '' }));
                    });

                    it("Returns the correct range", function() {
                        assert(_s($input.val('abcdef').range(0, 6).range())).equals(_s({ start: 0, end: 6, length: 6, text: 'abcdef' }));
                        assert(_s($input.val('abcdef').range(2, 5).range())).equals(_s({ start: 2, end: 5, length: 3, text: 'cde' }));
                        assert(_s($input.val('abcdef').range(3, 4).range())).equals(_s({ start: 3, end: 4, length: 1, text: 'd' }));

                        assert(_s($textarea.val('abc\ndef').range(0, 7).range())).equals(_s({ start: 0, end: 7, length: 7, text: 'abc\ndef' }));
                        assert(_s($textarea.val('abc\ndef').range(2, 5).range())).equals(_s({ start: 2, end: 5, length: 3, text: 'c\nd' }));
                        assert(_s($textarea.val('abc\ndef').range(3, 4).range())).equals(_s({ start: 3, end: 4, length: 1, text: '\n' }));
                    });

                    it("Normalizes newlines", function() {
                        assert(_s($textarea.val('abc\r\ndef').range(0, 7).range())).equals(_s({ start: 0, end: 7, length: 7, text: 'abc\ndef' }));
                        assert(_s($textarea.val('abc\r\ndef').range(2, 5).range())).equals(_s({ start: 2, end: 5, length: 3, text: 'c\nd' }));
                    });
                });

                describe('Set', function() {
                    it("Accepts a single argument", function() {
                        assert(_s($textarea.val('abc\ndef').range(0).range())).equals(_s($textarea.val('abc\ndef').range(0, 7).range()));
                        assert(_s($textarea.val('abc\ndef').range(3).range())).equals(_s($textarea.val('abc\ndef').range(3, 7).range()));
                    });

                    it("Accepts negative arguments", function() {
                        assert(_s($textarea.val('abc\ndef').range(-4).range())).equals(_s($textarea.val('abc\ndef').range(3).range()));
                        assert(_s($textarea.val('abc\ndef').range(0, -2).range())).equals(_s($textarea.val('abc\ndef').range(0, 5).range()));
                        assert(_s($textarea.val('abc\ndef').range(3, -2).range())).equals(_s($textarea.val('abc\ndef').range(3, 5).range()));
                        assert(_s($textarea.val('abc\ndef').range(-4, -2).range())).equals(_s($textarea.val('abc\ndef').range(3, 5).range()));
                    });
                });

                it("TODO: Test range positions AFTER replacement/insertion");
            });
        });

    });

}());