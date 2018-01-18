// Software License Agreement (ISC License)
//
// Copyright (c) 2017, Matthew Voss
//
// Permission to use, copy, modify, and/or distribute this software for
// any purpose with or without fee is hereby granted, provided that the
// above copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var test = require('test-kit').tape()
var utf8 = require('qb-utf8-ez')
var qbsrc = require('.')

test('concat', function (t) {
    t.table_assert([
        [ 'args',                                  'expect'   ],
        [ [] ,                                      '' ],
        [ [ 'a' ],                                  'a' ],
        [ [ 'a', 'b' ],                             'ab' ],
        [ [ 'a', 'b', 'c' ],                        'abc' ],
        [ [ 'ab', 'c' ],                            'abc' ],
        [ [ 'a', 'bc' ],                            'abc' ],
        [ [ '', 'abc' ],                            'abc' ],

    ], function (args) {
        var bufs = args.map(function (s) { return utf8.buffer(s) })
        var buf = qbsrc.concat.apply(null, bufs)
        return utf8.string(buf)
    } )
})

test('index_of_esc', function (t) {
    t.table_assert([
        [ 'input',          'off',      'lim',      'b',        'e',    'esc',  'expect'   ],
        // find unescaped (default)
        [ '' ,              null,       null,       'z',        '^',    false,  -1 ],

        [ 'abc' ,           null,       null,       'a',        '^',    false,   0 ],
        [ 'abc' ,           null,       null,       'b',        '^',    false,   1 ],
        [ 'abc' ,           null,       null,       'c',        '^',    false,   2 ],
        [ 'abc' ,           null,       null,       'c',        '^',    null,    2 ],
        [ 'abc' ,           null,       null,       'z',        '^',    false,  -1 ],
        [ 'baa' ,           null,       null,       'a',        '^',    false,   1 ],

        [ 'ab^c' ,          null,       null,       'c',        '^',    false,  -1 ],
        [ 'ab^^c' ,         null,       null,       'c',        '^',    null,   4 ],
        [ 'ab^^^c' ,        null,       null,       'c',        '^',    null,   -1 ],
        [ 'ab^^^c' ,        0,          2,          'b',        '^',    null,   1 ],
        [ '^^^c' ,          null,       null,       'c',        '^',    null,   -1 ],
        [ '^^c' ,           null,       null,       'c',        '^',    null,   2 ],
        [ 'ab^^^c' ,        1,          6,          'c',        '^',    null,   -1 ],
        [ 'ab^^^c' ,        2,          6,          'c',        '^',    null,   -1 ],
        [ 'ab^^^c' ,        3,          6,          'c',        '^',    null,   5 ],
        [ 'ab^^^c' ,        4,          6,          'c',        '^',    null,   -1 ],
        [ 'ab^^^c' ,        5,          6,          'c',        '^',    null,   5 ],
        [ 'ab^^^c' ,        5,          5,          'c',        '^',    null,   -1 ],

        // find escaped
        [ '' ,              null,       null,       'z',        '^',    true,   -1 ],
        [ 'abc' ,           null,       null,       'a',        '^',    true,   -1 ],
        [ 'abc' ,           null,       null,       'c',        '^',    true,   -1 ],
        [ 'ab^c' ,          0,          6,          'c',        '^',    true,   2 ],
        [ 'ab^^c' ,         0,          6,          'c',        '^',    true,   -1 ],
        [ 'ab^^^c' ,        0,          6,          'c',        '^',    true,   4 ],
        [ 'ab^^^c' ,        0,          5,          'c',        '^',    true,   -1 ],
    ], function (input, off, lim, b, e, escaped) {
        var src = utf8.buffer(input)
        b = b.charCodeAt(0)
        e = e.charCodeAt(0)
        return qbsrc.index_of_esc(src, off, lim, b, e, escaped)
    } )
})

test('index_of_esc errors', function (t) {
    t.table_assert([
        [ 'input',          'off',      'lim',        'b',      'esc',     'expect'   ],
        [ 'a^' ,             null,      null,         '^',      '^',       /escape and byte cannot be the same/ ],
        [ 'a^^' ,            null,      null,         '^',      '^',       /escape and byte cannot be the same/ ],
    ], function (src, off, lim, b, esc) {
        b = b.charCodeAt(0)
        esc = esc.charCodeAt(0)
        return qbsrc.index_of_esc(utf8.buffer(src), off, lim, b, esc)
    }, {assert: 'throws'})
})

test('index_of', function (t) {
    t.table_assert([
        [ 'src',          'off',      'lim',      'bsrc',       'boff',    'blim',  'expect'   ],
        [ '' ,            null,       null,       'a',          null,       null,   -1 ],
        [ '' ,            null,       null,       'ab',         null,       null,   -1 ],
        [ 'abc' ,         null,       null,       'aa',         null,       null,   -1 ],
        [ 'abc' ,         null,       null,       'abcd',       null,       null,   -1 ],
        [ 'abc' ,         null,       null,       'cc',         null,       null,   -1 ],
        [ 'abc' ,         null,       null,       'cd',         null,       null,   -1 ],
        [ 'abc' ,         null,       null,       'abc',        0,          4,      -1 ],

        [ 'abc' ,         null,       null,       'abc',        0,          3,      0 ],
        [ 'abc' ,         null,       null,       'abc',        0,          2,      0 ],
        [ 'abc' ,         null,       null,       'abc',        0,          1,      0 ],
        [ 'abc' ,         null,       null,       'abc',        1,          3,      1 ],
        [ 'abc' ,         null,       null,       'abc',        1,          2,      1 ],
        [ 'abc' ,         null,       null,       'abc',        2,          3,      2 ],

        [ 'abc' ,         0,          3,          'abc',        0,          3,      0 ],
        [ 'abc' ,         1,          3,          'abc',        1,          3,      1 ],
        [ 'abc' ,         2,          3,          'abc',        2,          3,      2 ],
        [ 'abc' ,         0,          2,          'abc',        0,          2,      0 ],
        [ 'abc' ,         1,          2,          'abc',        1,          2,      1 ],
        [ 'abc' ,         0,          1,          'abc',        0,          1,      0 ],
        [ 'abc' ,         0,          3,          'abc',        2,          3,      2 ],
        [ 'abc' ,         1,          3,          'abc',        2,          3,      2 ],
        [ 'abc' ,         null,       null,       'abc',        null,       null,   0 ],
        [ 'ab' ,          null,       null,       'ab',         null,       null,   0 ],
        [ 'abc' ,         null,       null,       'ab',         null,       null,   0 ],
        [ 'abc' ,         null,       null,       'bc',         null,       null,   1 ],
    ], function (src, off, lim, bsrc, boff, blim) {
        return qbsrc.index_of(utf8.buffer(src), off, lim, utf8.buffer(bsrc), boff, blim)
    })
})

test('index_of errors', function (t) {
    t.table_assert([
        [ 'src',          'off',      'lim',      'bsrc',        'boff',    'blim',  'expect'   ],
        [ '' ,            null,       null,       '',            null,       null,   /cannot search empty bytes/ ],
        [ 'abc' ,         null,       null,       'abc',         1,          1,      /cannot search empty bytes/ ],
    ], function (src, off, lim, bsrc, boff, blim) {
        qbsrc.index_of(utf8.buffer(src), off, lim, utf8.buffer(bsrc), boff, blim)
    }, {assert: 'throws'})
})

test('cmp', function (t) {
    t.table_assert([
        [ 'src1',   'off1',     'src2',     'off2', 'n', 'exp' ],
        [ 'zbc',    0,          'abz',      0,      3,    1 ],
        [ 'zbc',    1,          'abz',      1,      2,    -1 ],
        [ 'zbc',    2,          'abz',      2,      1,    -1 ],
        [ 'zbc',    1,          'abz',      1,      1,    0 ],
    ], function (src1, off1, src2, off2, n) {
        return qbsrc.cmp(utf8.buffer(src1), off1, utf8.buffer(src2), off2, n)
    })
})

test('cmp errors', function (t) {
    t.table_assert([
        [ 'src1',   'off1',     'src2',     'off2', 'n', 'exp' ],
        [ 'abc',    0,          'abz',      0,      0,    /cannot compare nothing/ ],
    ], function (src1, off1, src2, off2, n) {
        return qbsrc.cmp(utf8.buffer(src1), off1, utf8.buffer(src2), off2, n)
    }, {assert: 'throws'})
})

test('context_str', function (t) {
    t.table_assert([
        [ 'src',     'off', 'lim', 'lctx', 'rctx', 'max_select', 'exp' ],
        [ 'abcdefg', 0,     0,     2,      2,      10,           'src[0] -><-ab...' ],
        [ 'abcdefg', 0,     1,     2,      2,      10,           'src[0..1] ->a<-bc...' ],
        [ 'abcdefg', 1,     2,     2,      2,      10,           'src[1..2] a->b<-cd...' ],
        [ 'abcdefg', 1,     7,     2,      2,      null,         'src[1..7] a->bcdefg<-' ],
        [ 'abcdefg', 1,     7,     2,      2,      2,            'src[1..7] a->bc..<-' ],
        [ 'abcdefg', 1,     4,     2,      2,      2,            'src[1..4] a->bc..<-ef...' ],
        [ 'abcdefg', 4,     5,     1,      1,      2,            'src[4..5] ...d->e<-f...' ],
        [ 'abcdefg', 4,     6,     null,   null,   2,            'src[4..6] abcd->ef<-g' ],
        [ 'abcdefg', 4,     7,     null,   null,   2,            'src[4..7] abcd->ef..<-' ],
        [ 'abcdefg', 4,     10,    null,   null,   2,            'src[4..7] abcd->ef..<-' ],
        [ 'abcdefg', 4,     10,    1,      1,      2,            'src[4..7] ...d->ef..<-' ],
    ], function (src, off, lim, lctx, rctx, max_select) {
        return qbsrc.context_str(utf8.buffer(src), off, lim, lctx, rctx, max_select)
    })
})

test('str', function (t) {
    t.table_assert([
        ['src',       'off', 'lim',   'exp' ],
        [ [97, 98],   0,      1,      'a' ],
        [ [97, 98],   1,      2,      'b' ],
        [ [97, 98],   0,      2,      'ab' ],
        [ [97, 98],   0,      3,      'ab' ],
        [ [97, 0],    0,      2,      'a\\u00' ],
        [ [240, 0],   0,      2,      '\\uf0\\u00' ],
    ], qbsrc.str)
})

