var baseUrl = 'http://192.168.2.219:1122';

function $(key) {
    var a = key.charAt(0);
    var n;
    if (a === '#') {
        n = document.getElementById(key.slice(1));
    } else if (a === '.') {
        n = document.getElementsByClassName(key.slice(1));
    } else {
        n = document.getElementsByTagName(key);
    }
    return n;
}

// 设置cookie
function setCookie(name, value) {
    var expires;
    var date = new Date();
    date.setTime(date.getTime() + 999 * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

// 获取cookie
function getCookie(name) {
    var nameEQ = name + '=';
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}

// 获取URL参数
function getParameterByName(name) {
    // 将 name 转义为正则表达式
    name = name.replace(/[\[\]]/g, '\\$&');
    // 获取 URL 中的查询参数部分
    var url = window.location.search;
    // 判断 URL 中是否包含查询参数
    if (!url) {
        return null;
    }
    // 处理查询参数字符串
    url = decodeURIComponent(url);
    // 获取查询参数数组
    var params = url.substr(1).split('&');
    // 查找指定参数的值
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        var pos = param.indexOf('=');
        var paramName = param.substr(0, pos);
        var paramValue = param.substr(pos + 1);
        // 返回指定参数的值
        if (paramName === name) {
            return paramValue.replace(/\+/g, ' ');
        }
    }
    return null;
}

function ajax(method, url, data, callback) {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }
    xhr.open(method, baseUrl + url);

    if (method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    }

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                callback(null, JSON.parse(xhr.responseText));
            } else {
                callback(xhr.status, null);
            }
        }
    };

    xhr.send(JSON.stringify(data));
}

function getList() {
    ajax('GET', '/getBookshelf', {}, function(err, res) {
        var data = res.data;
        var bookList = '';
        for (var i in data) {
            var book = data[i];
            var b = window.encodeURIComponent(JSON.stringify(book));
            bookList += '<div class="book" onclick="jumpDetail(\''+b+'\')">' +
                '<div class="cover-img">' +
                '<img class="cover" src="' + baseUrl + '/cover?path=' +
                book['coverUrl'] + '" alt="' + book['name'] + '"></div>' +
                '<div class="info">' +
                '<div class="name">' + book['name'] + '</div>' +
                '<div class="sub">' +
                '<div class="author"> ' + book['author'] + ' </div>' +
                '<div class="dot">•</div>' +
                '<div class="size">共' + book['durChapterPos'] + '章</div>' +
                '<div class="dot">•</div>' +
                '<div class="date">' + dateFormat(book['durChapterTime']) +
                '</div>' +
                '</div>' +
                '<div class="dur-chapter">已读：' + book['durChapterTitle'] +
                '</div>' +
                '<div class="last-chapter"> 最新：' +
                book['latestChapterTitle'] + ' </div>' +
                '</div>' +
                '</div>';
        }
        $('#book_list').innerHTML = bookList;
    });
}

function getBookContent() {
    var url = getBookField('bookUrl');
    var index = getBookField('durChapterIndex');
    ajax('GET', '/getBookContent?url=' + url + '&index=' + index, {},
        function(err, res) {
            console.log(res);
            var content = res.data.split(/\n+/);
            var c = '';
            for (var i in content) {
                c += '<p>' + content[i] + '</p>';
            }
            var con = $('#content1');
            con.innerHTML = c;
            con.scrollTop = 0;
        });
}

function getDetail(url) {
    ajax('GET', '/getChapterList' + url, {}, function(err, res) {
        console.log(res);
    });
}

function saveBookProgress() {
    ajax('POST', '/saveBookProgress', {
        name: bookName,
        author: bookAuthor,
        durChapterIndex: index,
        durChapterPos: chapterPos,
        durChapterTime: new Date().getTime(),
        durChapterTitle: title
    }, function(err, res) {
        console.log(res);
    });
}

function getChapterList() {
    var url = getBookField('bookUrl');
    ajax('GET', '/getChapterList?url=' + url, {}, function(err, res) {
        console.log(res);
    });
}

function jumpDetail(book) {
    book = window.decodeURIComponent(book);
    setCookie('book', book);
    location.href = 'detail.html';
}

function getBookField(name) {
    var book = getCookie('book');
    book = JSON.parse(book);
    return book[name];
}

function updateBookField(name, val) {
    var book = getCookie('book');
    book = JSON.parse(book);
    book[name] = val;
    book = JSON.stringify(book);
    setCookie('book', book);
}

function jump(url) {
    location.href = url;
}

function prev() {
    var index = getBookField('durChapterIndex')
    index--;
    if (index < 0) {
        alert('已经到第一章了，前面没有喽！')
    } else {
        updateBookField('durChapterIndex', index)
        getBookContent()
    }
}

function next() {
    var index = getBookField('durChapterIndex')
    index++;
    updateBookField('durChapterIndex', index)
    getBookContent()
}

function dateFormat(t) {
    var time = new Date().getTime();
    var int = parseInt((time - t) / 1000);
    var str;
    Date.prototype.format = function(fmt) {
        var o = {
            'M+': this.getMonth() + 1, //月份
            'd+': this.getDate(), //日
            'h+': this.getHours(), //小时
            'm+': this.getMinutes(), //分
            's+': this.getSeconds(), //秒
            'q+': Math.floor((this.getMonth() + 3) / 3), //季度
            S: this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                (this.getFullYear() + '').substr(4 - RegExp.$1.length)
            );
        }
        for (var k in o) {
            if (new RegExp('(' + k + ')').test(fmt)) {
                fmt = fmt.replace(
                    RegExp.$1,
                    RegExp.$1.length === 1
                        ? o[k]
                        : ('00' + o[k]).substr(('' + o[k]).length)
                );
            }
        }
        return fmt;
    };
    if (int <= 30) {
        str = '刚刚';
    } else if (int < 60) {
        str = int + '秒前';
    } else if (int < 3600) {
        str = parseInt(int / 60) + '分钟前';
    } else if (int < 86400) {
        str = parseInt(int / 3600) + '小时前';
    } else if (int < 2592000) {
        str = parseInt(int / 86400) + '天前';
    } else {
        str = new Date(t).format('yyyy-MM-dd');
    }
    return str;
}
