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

function concat_srcs () {
    var nbytes = 0
    for (var ai=0; ai<arguments.length; ai++) { nbytes += arguments[ai].length }
    var ret = new Uint8Array(nbytes)
    var ri = 0
    for (var i=0; i<arguments.length; i++) {
        var src = arguments[i]
        var len = src.length
        for (var j=0; j<len; j++) {
            ret[ri++] = src[j]
        }
    }
    return ret
}

// return the index of the given byte, taking into account an escape character (byte)
//
// b        byte to find
// e        escape character (as ascii byte)
// escaped  false (default) return index of b iff b is *not* preceded by escape
//          true            return index of escape (index of b-1) iff b is preceded by escape

function index_of_esc (src, off, lim, b, e, escaped) {
    var adj = escaped ? 1 : 0
    b !== e || err('escape and byte cannot be the same')
    lim = lim == null ? src.length : lim
    for (var i = off || 0; i < lim; i++) {
        if (src[i] === b) {
            // count number of escapes going backwards (n = escape count +1)
            for (var n = 1; src[i-n] === e && i-n >= off; n++) {}
            if ((n + adj) % 2) {
                return i - adj      // for escaped, return the index of the preceding escape
            }
        }
    }
    return -1
}

// return the index of the given byte selection in bsrc within src - for shortish byte sets (bsrc).
function index_of (src, off, lim, bsrc, boff, blim) {
    off = off || 0
    lim = lim == null ? src.length : lim
    boff = boff || 0
    blim = blim == null ? bsrc.length : blim
    blim > boff || err('cannot search empty bytes')
    var blen = blim - boff
    lim = lim - blen + 1
    main_loop: for (var i = off; i < lim; i++) {
        if (src[i] === bsrc[boff]) {
            for (var j = 1; j < blen; j++) {
                if (src[i+j] !== bsrc[boff+j]) {
                    continue main_loop
                }
            }
            return i
        }
    }
    return -1
}

function cmp (src1, off1, src2, off2, n) {
    n > 0 || err('cannot compare nothing (n=0)')
    for (var i=0; i<n; i++) {
        if (src1[off1 + i] !== src2[off2 + i]) {
            return src1[off1 + i] > src2[off2 + i] ? 1 : -1
        }
    }
    return 0
}

// return a portion of the buffer as a string with context information selecting between off and lim and
// providing up to lctx and rctx of bytes left and right of the selection.
//
// note - does not gracefully handle split multi-byte unicode chars
function context_str (src, sel_off, sel_lim, lctx, rctx, max_select) {
    sel_off = Math.max(sel_off, 0)
    sel_off = Math.min(sel_off, src.length)
    sel_lim = Math.max(sel_lim, 0)
    sel_lim = Math.min(sel_lim, src.length)
    lctx = lctx == null ? 160 : lctx
    rctx = rctx == null ? 100 : rctx
    max_select = max_select || 20
    var coff = Math.max(sel_off - lctx, 0)              // up to lctx bytes before
    var clim = Math.min(sel_lim + rctx, src.length)     // up to rctx bytes after

    var lstr = coff < sel_off ? str(src, coff, sel_off) : ''
    if (coff > 0) { lstr = '...' + lstr }
    var rstr = sel_lim < clim ? str(src, sel_lim, clim) : ''
    if (clim < src.length) { rstr = rstr + '...' }

    var selected
    if (sel_lim - sel_off > max_select) {
        selected = str(src, sel_off, sel_off + max_select) + '..'
    } else {
        selected = str(src, sel_off, sel_lim)
    }

    var rangestr = sel_off === sel_lim ? String(sel_off) : (sel_off + '..' + sel_lim)

    return 'src[' + rangestr + '] ' + lstr + '->' + selected + '<-' + rstr
}

function str (src, off, lim) {
    if (lim > src.length) { lim = src.length }
    var ret = ''
    for (var i = off; i < lim; i++) {
        var b = src[i]
        ret += (b > 31 && b < 127) ? String.fromCharCode(b) : '\\u' + ("00" + b.toString(16)).slice(-2)
    }
    return ret
}

function err (msg) { throw Error (msg) }

module.exports = {
    concat: concat_srcs,
    index_of: index_of,
    index_of_esc: index_of_esc,
    cmp: cmp,
    context_str: context_str,
    str: str,
}
