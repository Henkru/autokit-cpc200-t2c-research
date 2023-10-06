const sidenav = document.querySelectorAll('nav .nav-links .nav-item');
var targetName = 'connection';
var target = null;
var count = 0;
var rotate_timer = null;
var wst = null;
var icon = '';
var tsllink = -1;
var ws = null;
var linking = false;
var night = 0;
var lyver = '';


function si(id,txt) {
	var d = document.getElementById(id);
	if (d) d.innerHTML = txt;
}

function ss(d,s) {
	var a = document.getElementById(s);
	var b = document.getElementById(d);
	if (b && a) b.innerHTML = a.innerHTML;
}

function hp(i) {
	var d = document.getElementById(i);
	if (d) d.parentElement.className = 'hidden';
}

function rotate() {
	var elem = document.getElementById('loading-' + targetName);
	if (elem) {
		elem.style.transform = 'scale(0.5) rotate('+count+'deg)';
		if (count==360) { count = 0 }
		count+=45;
	} else {
		clearInterval(rotate_timer);
		rotate_timer = null;
		console.log("stop rotate");
	}
}

function get_appropriate_ws_url(extra_url) {
	var pcol;
	var u = document.URL;
	if (u.substring(0, 5) === "https") {
		pcol = "wss://";
		u = u.substr(8);
	} else {
		pcol = "ws://";
		if (u.substring(0, 4) === "http")
			u = u.substr(7);
	}
	u = u.split("/");
	return pcol + u[0] + "/" + extra_url;
}

function new_ws(urlpath, protocol) {
	if (typeof MozWebSocket != "undefined")
		return new MozWebSocket(urlpath, protocol);

	return new WebSocket(urlpath, protocol);
}

function bt_changed(mac) {
	if (mac) {
		if (mac != btconn) {
			console.log(mac + " connected!!!");
			if (targetName == 'device') {
				var elem = document.getElementById(mac);
				if (elem) {
					elem.className = 's';
				} else {
					wsCmd(5);
					return;
				}
			}
			btconn = mac;
			if (btdelay == btconn) {
				btdelay = null;
			}
		}
	} else if (btconn) {
		if (targetName == 'device') {
			var elem = document.getElementById(btconn);
			if (elem) {
				elem.removeAttribute('class');
			}
		}
		btconn = null;
		if (btdelay) {
			on_connect_bt(btdelay);
		}
		if (btdel) {
			on_delete_bt(btdel);
		} 
	}
}

function add_debug_info(info) {
	console.log(info);
}

function switch_video(link) {
	if (link != tsllink) {
		var video = document.getElementById('video');
		console.log("link: " + tsllink + " to " + link);
		if (link > 1) {
			wsCmd(0);
			video.className = 'video';
			video.nextElementSibling.className = 'hidden';
			video.firstElementChild.src = '/video.jpg?t=' + Date.now();
		} else {
			if (tsllink > 1) {
				video.className = 'hidden';
				video.nextElementSibling.className = 'container';
				if (targetName == 'connection') {
					document.getElementById('devlist').click();
				} else {
					target.click();
				}
			}
			if (link == 0) {
				worker.postMessage({id: 'clear'});
			}
		}
		if (link < 1 && linking && tsllink > 0) {
			set_linking(false);
		}
		tsllink = link;
	}
}

function hw(j) {
	var hw = j.HW.split('-');
	var md = j.MD.split('-');
	if (hw.length > 1 && md.length > 1) {
		var v = hw[hw.length-2].split('_');
		si('imei', j.imei);
		si('iccd', j.ccid);
		return [md[0], hw[1], v[v.length-1], hw[hw.length-1], md[1]].join('-');
	} else {
		hp('ntv');
		hp('sync');
		return [md[0], 'BT', 'PanNet', md[1]].join('-');
	}
}

var page4g = null;
var driver = 0;
var sig = 6;
var wslink = false;

function csq(c,s) {
	var t = page4g.children[0];
	if (c == 0) {
		t.children[1].style.display = 'none';
		t.children[2].style.display = null;
	} else {
		t.children[1].style.display = null;
		t.children[2].style.display = 'none';
	}
	if (sig != s) {
		sig = s;
		document.getElementById('cv').src = 'img/sig/' + s + '.png';
	}
}

function ecard_register() {
	var t = Math.floor(Date.now() / 1000);
	fetch('/ecard_query?t=' + t).then(r => r.json()).then(j => {
		if (j.success) {
			si('ec0', j.data.productId);
			si('ec00', j.data.expireDate);
			if (j.data.totalFlow == -1) {
				si('ec01', "INF");
			} else {
				si('ec01', j.data.totalFlow + "M");
				si('ec02', (j.data.totalFlow - j.data.usableFlow) + "M");
				si('ec03', j.data.usableFlow + "M");
			}
			document.getElementById("ecard").removeAttribute('style');
		}
	}).catch(e => {
		console.log("error11: " + e);
	});
	fetch('/ecard_qrcode?t=' + t).then(r => r.json()).then(j => {
		if (j.success) {
			var d = document.getElementById('qrcode');
			d.src = j.data;
		}
	}).catch(e => {
		console.log("error22: " + e);
	});
}

function getTesla() {
	var u = navigator.userAgent;
	var i = u.indexOf('Tesla');
	if (i > 0) return u.substring(i);
	return 'null';
}

function set_linking(v) {
	linking = v;
	console.log('linking:' + v);
}

function createWebSocket() {
	ws = new_ws(get_appropriate_ws_url(""), "tsl");
	ws.binaryType = 'arraybuffer';
	try {
		ws.onopen = function() {
			var s = navigator.language;
			if (s.length > 10) s = s.substring(0,10);
			var v = getTesla();
			var h = new Int16Array([s.length+v.length+6,2,window.innerWidth,window.innerHeight]);
			var r = new Int8Array(4 + h[0]);
			r.set(new Int8Array(h.buffer), 0);
			i = h.byteLength;
			if (s.length>0)r.set(str2arr(s),i);
			i+=s.length;
			r[i++]=0;
			if (v.length>0)r.set(str2arr(v),i);
			i+=v.length;
			r[i++]=0;
			ws.send(r);
			console.log("onopen");
			wslink = true;
			ws.dec = new TextDecoder("utf-8");
			ws.ping = 0;
			ws.pong = 0;
			ws.timer = setInterval(function() {
				if (ws.pong + 3 < ws.ping) {
					if (tsllink > 2) {
						upfl();
					} else if (tsllink > 0) {
						switch_video(-1);
					}
					console.log('ping timeout');
					ws.close();
				} else {
					ws.send(new Uint32Array([786436,ws.ping]));
					ws.ping ++;
				}
			}, 1000);
		};
		ws.onmessage = function(ev) {
			var hdr = new Uint32Array(ev.data.slice(0,8));
			var data = ev.data.slice(8);
			if (hdr[0] != ev.data.byteLength - 8) {
				console.log('hdr not 5 ' + [hdr[0], hdr[1], ev.data.byteLength]);
				ws.close();
				return;
			}
			switch(hdr[1]) {
			case 0:
				var j = JSON.parse(ws.dec.decode(data));
				ws.pong = j.pong;
				bt_changed(j.bt);
				if (tsllink < 2) {
					var cv = document.getElementById('cv');
					var t = page4g.children[2].children[1];
					if (j.apn == null || j.apn.length == 0) {
						t.innerHTML = 'N/A';
					} else if (t.innerHTML != j.apn) {
						t.innerHTML = j.apn;
					}
					t = cv.nextElementSibling;
					if (t.innerHTML != j.csq) {
						t.innerHTML = j.csq;
						csq(j.csq,j.sig);
					}
				}
				break;
			case 1:
				var j = JSON.parse(ws.dec.decode(data));
				lyver = j.LY.split('.')[1];
				set_linking(j.phone && j.link < 1);
				if (rotate_timer) clearInterval(rotate_timer);
				if (linking) {
					rotate_timer = setInterval(rotate, 100);
				} else {
					rotate_timer = null;
					document.getElementById('connecting-connection').style.display = 'none';
				}
				for (var name of ['bt1', 'bt2', 'bt3']) document.getElementById(name).innerHTML = j.bt;
				si('ssid', j.ssid);
				document.getElementById('psk').value = j.psk;
				document.getElementById("auto").checked = j.auto;
				night = j.night;
				if (night > 2) {
					document.getElementById('night_off').checked = true;
					j.night -= 3;
				} else {
					document.getElementById('night_off').checked = false;
				}
				document.getElementById('ol').checked = j.online;
				if (night > 0 && night < 3) hr();
				document.getElementById('sync').checked = j.btnet;
				document.getElementById('nights').children[j.night].className = 'chosen';
				document.getElementById('pixels').children[j.pixel].className = 'chosen';
				driver = j.driver;
				document.getElementById('drivers').children[driver].className = 'chosen';
				document.getElementById('fps').children[j.fps].className = 'chosen';
				document.getElementById('mode').children[j.vid?1:0].className = 'chosen';
				document.getElementById('icons').children[j.icon==0?0:1].click();
				document.getElementById('lans').children[j.lan].children[0].className = 'y';
				si('sn', j.SN);
				if (j.SW.indexOf('test') > 0) {
					document.getElementById('fw').parentElement.parentElement.style.display = 'none';
				}
				si('sw', j.SW);
				si('hw', hw(j));
				si('md', j.HW);
				si('uuid', j.wifi);
				init_canvas(j.vid);
				switch_video(j.link);
				if (j.link == 1 && channel == -1) wsCmd(0);
				channel = j.ch;
				chtmp = j.sh;
				whw();
				whs();
				icon = j.icon;
				update_icons(j.icons);
				document.getElementById('name').value = j.name;
				if (j.bl == 1) document.getElementById('backlist').removeAttribute('class');
				/* ecard_register(); */
				break;
			case 2:
				if (targetName == 'device') {
					update_btlist();
				}
				break;
			case 3:
				var j = JSON.parse(ws.dec.decode(data));
				if (rotate_timer) {
					if (j.link > 0 || !j.phone) {
						var elem = document.getElementById('connecting-' + targetName);
						if (elem) {
							elem.style.display = 'none';
						}
						clearInterval(rotate_timer);
						rotate_timer = null;
						set_linking(false);
						console.log("disconnecting");
					}
				} else if (j.phone && j.link < 1) {
					var elem = document.getElementById('connecting-' + targetName);
					if (elem) {
						elem.style.display = null;
					}
					rotate_timer = setInterval(rotate, 100);
					set_linking(true);
					console.log("connecting");
				}
				switch_video(j.link);
				break;
			case 4:
				var j = JSON.parse(ws.dec.decode(data));
				ws.pong = j.pong;
				if (j.val > 0 && j.val < 3) {
					tsllink ++;
					if (tsllink < 115) {
						setPct(tsllink / 6 + 80);
					}
				} else if (j.val == 3) {
					ss('dialog', 'u2');
					si('sw', '');
					tsllink = 0;
				}
				break;
			case 5:
				rf();
				break;
			case 100:
				if (tsllink > 1) {
					var len = new Uint32Array(data.slice(0,4))[0];
					if (len + 4 != data.byteLength) {
						add_debug_info('single len:' + [len,data.byteLength]);
						ws.close();
					} else {
						worker.postMessage({id: 'decode', data: new Uint8Array(data.slice(4))});
					}
				}
				break;
			case 101:
				if (tsllink > 1) {
					var len = new Uint32Array(data.slice(0,4))[0];
					if (len > 1000000) {
						add_debug_info('first size:' + [len, ev.data.byteLength]);
						ws.close();
					} else {
						ws.off = ev.data.byteLength - 12;
						if (ws.off > len) {
							add_debug_info('first off:' + [ws.off, len]);
							ws.close();
						} else {
							ws.h264 = new Uint8Array(len);
							ws.h264.set(new Uint8Array(data.slice(4)),0);
						}
					}
				}
				break;
			case 102:
				if (ws.h264) {
					if (ws.off + data.byteLength > ws.h264.byteLength) {
						add_debug_info('freg off:' + [ws.off, data.byteLength, ws.h264.byteLength]);
						ws.close();
					} else {
						ws.h264.set(new Uint8Array(data),ws.off);
						ws.off += data.byteLength;
					}
				}
				break;
			case 103:
				if (ws.h264) {
					if (ws.off + ev.data.byteLength > ws.h264.byteLength + 8) {
						add_debug_info('last off:' + [ws.off, ws.h264.byteLength, ev.data.byteLength ]);
						ws.close();
					} else {
						ws.h264.set(new Uint8Array(data), ws.off);
						ws.off += ev.data.byteLength - 8;
						worker.postMessage({id: 'decode', data: ws.h264});
						ws.h264 = null;
					}
				}
				break;
			case 300:
				var qr = document.getElementById('qr');
				qr.removeAttribute('style');
				qr.innerHTML = '';
				new QRCode(qr, {
					text: ws.dec.decode(data),
					correctLevel: 1
				});
				break;
			default:
				add_debug_info("unknown id" + hdr[1]);
				ws.close();
				break;
			}
		};
		ws.onclose = function(){
			console.log("onclose");
			if (ws.timer) {
				clearInterval(ws.timer);
				ws.timer = null;
			}
			wslink = false;
			reconn();
			switch_video(-1);
		};
		
		ws.onerror = function(){
			console.log("onerror");
			if (ws.timer) {
				clearInterval(ws.timer);
				ws.timer = null;
			}
			reconn();
		};
	} catch(exception) {
		alert("<p>Error " + exception);  
	}
}

var wsl = false;
function reconncb() {
	if (document.hidden) {
		setTimeout(reconncb, 1000);
	} else {
		createWebSocket();
		console.log("reconnecting:" + new Date());
		wsl = false;
	}
}

function reconn() {
	if(wsl) return;
	wsl = true;
	setTimeout(reconncb, 1000);
}

function wsCmd(cmd) {
	if (wslinking()) ws.send(new Int16Array([2, 3, cmd]));
}

function on_listbtn(a) {
	var i = 0;
	var r = 0;
	if (a.className != "chosen") {
		for (var b of a.parentElement.children) {
			if (a == b) {
				b.className = 'chosen';
				r = i;
			} else {
				b.className = '';
			}
			i++;
		}
	}
	return r;
}

var isdown = false;
var isnight = 2;
var image = null;
var channel = -1;

function ws_sendtouch(m, x, y) {
	ws.send(new Int16Array([6, 1, m, x, y]));
}

function on_mouse(e, m) {
	var y = (e.pageY - image.offsetTop) * 1000 / image.offsetHeight;
	var x = (e.pageX - image.offsetLeft) * 1000 / image.offsetWidth;
	ws_sendtouch(m, x, y);
}

function touch_down(e, m) {
	if (e.touches.length > 0) {
		var y = (e.touches[0].pageY - image.offsetTop) * 1000 / image.offsetHeight;
		var x = (e.touches[0].pageX - image.offsetLeft) * 1000 / image.offsetWidth;
		ws_sendtouch(m, x, y);
	}
}

function touch_up(e, m) {
	if (e.changedTouches.length > 0) {
		var y = (e.changedTouches[0].pageY - image.offsetTop) * 1000 / image.offsetHeight;
		var x = (e.changedTouches[0].pageX - image.offsetLeft) * 1000 / image.offsetWidth;
		ws_sendtouch(m, x, y);
	}
}

function onsig(d) {
	if (!d.classList.contains('y')) {
		var p = d.parentElement;
		for (var c of p.children) {
			c.classList.remove('y');
		}
		d.classList.add('y');
		if (d == p.children[0]) {
			chtmp = p.previousElementSibling.children[0].className == 'chosen' ? 0 : 255;
		} else {
			chtmp = parseInt(d.children[1].innerHTML);
		}
	}
}

var chtmp = 255;
function onselsig() {
	var g = document.getElementById('sig').firstElementChild;
	if (chtmp < 15) {
		if (g.children[0].className == 'chosen') {
			if (chtmp == 0) {
				g.nextElementSibling.children[0].classList.add('y');
			} else {
				for (var d of g.nextElementSibling.children) {
					if (d.children[1].innerHTML == chtmp) {
						d.classList.add('y');
					}
				}
			}
		}
	} else {
		if (g.children[1].className == 'chosen') {
			if (chtmp == 255) {
				g.nextElementSibling.children[0].classList.add('y');
			} else {
				for (var d of g.nextElementSibling.children) {
					if (d.children[1].innerHTML == chtmp) {
						d.classList.add('y');
					}
				}
			}
		}
	}
}

function onLoad() {
	for (var m of sidenav) {
		m.addEventListener('click', function() {
			const t = this.dataset.target;
			const targetPage = document.getElementById(t);
			for (var m of sidenav) {
				if (m.classList.contains('active')) m.classList.remove('active');
			}
			this.classList.add('active');
			if (tsllink && t == 'connection') {
				if (tsllink > 1) tsllink = 1;
				wsCmd(0);
			} else {
				const mainPage = document.querySelector('.main-menu');
				for (var m of mainPage.children) {
					if (m.classList.contains('show-up')) m.classList.remove('show-up');
				}
				targetPage.classList.add('show-up');
				targetName = t;
				target = this;
				eval('on_' + targetName + '_load()');
			}
		});
	}

	elem = document.getElementById("auto");
	elem.onchange = function() {
		if (this.checked) {
			wsCmd(1);
		} else {
			wsCmd(2);
		}
	};
	elem = document.getElementById('nights');
	for (var a of elem.children) {
		a.onclick = function() {
			if (!wslinking()) return;
			var n = on_listbtn(this);
			night = night > 2 ? n + 3 : n;
			ws.send(new Int16Array([4,7,1,night]));
			if (night < 3 && night > 0) {
				isnight = 2;
				hr();
			}
		}
	}
	elem = document.getElementById('pixels');
	for (var a of elem.children) {
		a.onclick = function() {
			if (!wslinking()) return;
			var n = on_listbtn(this);
			ws.send(new Int16Array([4, 7, 2, n]));
		}
	}
	elem = document.getElementById('fps');
	for (var a of elem.children) {
		a.onclick = function() {
			if (!wslinking()) return;
			var n = on_listbtn(this);
			ws.send(new Int16Array([4, 7, 9, n]));
		}
	}
	elem = document.getElementById('mode');
	for (var a of elem.children) {
		a.onclick = function() {
			if (!wslinking()) return;
			var n = on_listbtn(this);
			ws.send(new Int16Array([4, 7, 11, n]));
		}
	}
	elem = document.getElementById('drivers');
	for (var a of elem.children) {
		a.onclick = function() {
			if (!wslinking()) return;
			driver = on_listbtn(this);
			ws.send(new Int16Array([4, 7, 3, driver]));
		}
	}
	elem = document.getElementById('sync');
	elem.onchange = function() {
		if (!wslinking()) return;
		ws.send(new Int16Array([4,7,8,this.checked?2:1]));
	}
	elem = document.getElementById('night_off');
	elem.onchange = function() {
		if (!wslinking()) return;
		if (this.checked) {
			night += 3;
		} else {
			night -= 3;
		}
		if (night > 0 && night < 3) {
			hr();
		} else {
			if (wst) {
				clearTimeout(wst);
				wst = null;
			}
			ws.send(new Int16Array([2,8,night>2?1:0]));
		}
		ws.send(new Int16Array([4,7,1,night]));
	}
	elem = document.getElementById('ol');
	elem.onchange = function() {
		if (!wslinking()) return;
		ws.send(new Int16Array([4,7,10,this.checked?1:0]));
	}
	elem = document.getElementById('lans');
	for (var a of elem.children) {
		a.children[0].onclick = function() {
			var i = 0;
			var p = this.parentElement;
			if (this.className == 'y') {
				return;
			}
			for (var b of p.parentElement.children) {
				if (b == p) {
					this.className = 'y';
					ws.send(new Int16Array([4, 7, 7, i]));
				} else {
					b.children[0].className = 'n';
				}
				i++;
			}
			rf();
		}
	}

	elem = document.getElementById('sw');
	elem.c = 0;
	elem.onclick = function() {
		var t = this;
		if (t.t) clearTimeout(t.t);
		if (t.c < 4) {
			t.c ++;
			t.t = setTimeout(function(p) {
				p.c = 0;
				p.t = null;
			}, 1000, t);
		} else {
			t.c = 0;
			t.t = null;
			window.location = '/mic.html';
		}
	}

	elem = document.getElementById('hw');
	elem.ondblclick = function() {
		this.style.display = 'none';
		this.nextElementSibling.style.display = null;
	}

	elem = document.getElementById('md');
	elem.ondblclick = function() {
		this.style.display = 'none';
		this.previousElementSibling.style.display = null;
	}

	elem = document.getElementById('fw');
	elem.addEventListener('click', function() {
		fetch(get_remote_url() + '/' + lyver + '/version.json?rand=' + Math.random()).then(r =>
			r.json()).then(j => {
				const v = document.getElementById('sw').innerHTML;
				var d = document.getElementById('dialog');
				d.style.display = 'flex';
				if (j.tsl > v) {
					d.innerHTML = document.getElementById('u1').innerHTML;
					d = d.children[0].children[0].children[1];
					d.innerHTML = j.tsl + "</br>" + j.msg;
					vu = j.url;
				} else {
					d.innerHTML = document.getElementById('u0').innerHTML;
				}
			}).catch(e => upfl());
	}, false);
	elem = document.getElementById('name');
	elem.addEventListener('keyup', function() {
		var d = document.getElementById('name');
		var a = str2arr(d.value);
		var s = d.value;
		while(a.length > 12) {
			d.value = d.value.substr(0, d.value.length - 1);
			a = str2arr(d.value);
		}
	}, false);

	elem = document.getElementById('qr');
	elem.addEventListener('click', function() {
		this.style.height = this.clientHeight + 'px';
		this.style.backgroundColor = 'transparent';
		this.innerHTML = '';
		wsCmd(9);
	}, false);

	window.addEventListener('visibilitychange', function() {
	if (document.hidden) {
		if (ws) ws.close();
	} else {
		rf();
	}});

	window.addEventListener("resize", function() {
		if (wst) this.clearTimeout(wst);
		wst = this.setTimeout(rf(), 1000);
	});

	page4g = document.getElementById('cell');
}

function init_canvas(is_video) {
	var n = is_video ? 'carplay' : 'imgcp';
	if (image != null) {
		return;
	}
	image = document.getElementById(n);
	image.className = 'show';
	image.addEventListener("touchstart", function(e) {
		isdown = true;
		touch_down(e, 0);
		e.preventDefault();
	} ,false);
	image.addEventListener("touchmove", function(e) {
		if(isdown) {touch_down(e, 2);}
	} ,false);
	image.addEventListener("touchend", function(e) {
		touch_up(e, 1);
		isdown = false;
	} ,false);
	image.addEventListener("mousedown", function(e) {
		isdown = true; 
		on_mouse(e, 0);
	} ,false);
	image.addEventListener("mousemove", function(e) {
		if(isdown) {on_mouse(e, 2);}
	} ,false);
	image.addEventListener("mouseup", function(e) {
		on_mouse(e, 1);
		isdown = false;
	} ,false);
	image.addEventListener("dragstart", function(e) {
		e.preventDefault();
	} ,false);

	if (is_video) {
		const offscreen = image.transferControlToOffscreen();
		worker = new Worker('/js/worker.js');
		worker.onmessage = function(ev) {
			switch(ev.data) {
			case 'key':
				if (worker.timer) {
					clearTimeout(worker.timer);
					worker.timer = null;
				}
				break;
			case 'sps':
				if (!worker.timer) {
					worker.timer = setTimeout(function() {
						wsCmd(8);
						worker.timer = null;
					}, 2000);
				}
				break;
			}
		}
		worker.postMessage({id:'init', canvas: offscreen}, [offscreen]);
	} else {
		worker = image;
		worker.postMessage = function(d,a) {
			console.log('post ' + d.id);
		}
	}
}

function get_remote_url() {
	var uri = document.baseURI;
	var test = uri.indexOf('test=');
	if (test > 0) {
		return uri.substring(test + 5, uri.indexOf('#', test));
	}
	return 'https://cpbox.oss-cn-shenzhen.aliyuncs.com';
}

function un(h) {
	var n = 2;
	if (night == 0) {
		n = 0;
	} else if (night == 1) {
		n = h < 6 || h > 17 ? 1: 0;
	} else if (night == 2) {
		n = h < 7 || h > 18 ? 1: 0;
	}
	if (n != isnight && n < 2) {
		isnight = n;
		ws.send(new Int16Array([2,8,n]));
	}
}

function othr(h) {
	wst = setTimeout(othr, 3600000, h + 1);
	un(h);
}

function hr() {
	var t = new Date();
	var s = 3600 - t.getMinutes() * 60 + t.getSeconds();
	var h = t.getHours();
	un(h);
	setTimeout(othr, s * 1000, h + 1);
}

onLoad();
createWebSocket();

var btconn = null;
var btdel = null;
var btdelay = null;


var str2arr = window.TextEncoder ? function(str) {
    var encoder = new TextEncoder('utf8');    
    return encoder.encode(str);
} : function (str) {
	var r = [];
	for (var i of str) {
		const c = i.charCodeAt(0);
		r.push(c < 128 ? c : 88);
	}
	return r;
}

function wsstr(c,s) {
	if (!wslinking()) return false;
	var h = new Int16Array([s.length, c]);
	var r = new Int8Array(4 + h[0]);
	r.set(new Int8Array(h.buffer), 0);
	if (s.length > 0) r.set(str2arr(s), 4);
	ws.send(r);
	return true;
}

function on_connect_bt(m) {
	if (btconn == null) {
		wsstr(4,m);
	} else if (btconn != m) {
		btdelay = m;
		wsstr(5,m);
	} else if (btdelay) {
		btdelay = null;
	}
}

function on_disconnect_bt(m) {
	if (btconn == m) {
		wsstr(5,m);
	}
}

function on_delete_bt(m) {
	if (btconn == m) {
		btdel = m;
		wsstr(5,m);
	} else {
		if (btdel) btdel = null;
		wsstr(6,m);
		update_btlist();
	}
}

function update_btlist() {
	fetch('/tsl/bt').then(r => {
		if (r.status == 200) return r.json();
		throw {message: r.statusText};
	}).then(j => {
		var elem = document.getElementById('btlist');
		var html = '';
		for (var i of j) {
			html += '<a id="' + i.substr(1, 12) + '" href="#"><div></div><img src="./img/delete.png" class="img"></a><hr/>' 
		}
		if (html == '') {
			elem.innerHTML = document.getElementById('nobt').innerHTML;
		} else {
			elem.innerHTML = html;
			if (btconn) {
				document.getElementById(btconn).className = 's';
			}
			for (var i of j) {
				document.getElementById(i.substr(1, 12)).firstElementChild.innerText = i.substr(13);
			}
		}
		for (var a of elem.getElementsByTagName('a')) {
			a.addEventListener('click', function() {
				if (this.className == 's') {
					on_disconnect_bt(this.id);
				} else {
					on_connect_bt(this.id);
				}
			}, false);
		}
		for (var i of elem.getElementsByTagName('img')) {
			i.addEventListener('click', function(e) {
				on_delete_bt(this.parentElement.id);
				e.stopPropagation();
			}, false);
		}
	}).catch(err => {
		console.log(err.message);
	});
}

function rotate_start() {
	var elem = document.getElementById('connecting-' + targetName);
	if (linking) {
		if (rotate_timer == null) {
			rotate_timer = setInterval(rotate, 100);
		}
		elem.style.display = null;
	} else {
		elem.style.display = 'none';
	}
}

function on_connection_load() {
	rotate_start();
}

function on_device_load() {
	update_btlist();
	rotate_start();
}

function on_cell_load() {
	
}

function on_wifi_load() {
	
}

function on_bluetooth_load() {
	
}

function on_night_load() {
	
}

function on_language_load() {
	
}

function on_system_load() {
	
}

function on_about_load() {
	
}

function setPct(a) {
	document.getElementById('pgt').innerHTML = Math.floor(a) + '%';
}

var vu = null;
async function dnld() {
	var r = await fetch(vu + '?rand=' + Math.random());
	const rd = r.body.getReader();
	const total = +r.headers.get('Content-Length');
	var loaded = 0;
	var cs = new Uint8Array(total);
	console.log('total:' + total);
	while(true) {
		const {done, value} = await rd.read();
		if (done) break;
		cs.set(value, loaded);
		loaded += value.length;
		setPct(loaded * 70 / total);
	}
	return cs;
}

function upfl() {
	var d = document.getElementById('dialog');
	d.innerHTML = document.getElementById('u3').innerHTML;
}

function upld(a) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status === 200) {
				setPct(80);
				tsllink = 3;
				console.log("upok");
			} else {
				upfl();
			}
		}
	};
	xhr.upload.addEventListener("progress", function(e) {
		setPct(70 + e.loaded * 9 / e.total);
	}, false);
	xhr.upload.addEventListener('loadstart', function (e) {
		console.log("start upload");
	});
	xhr.open("POST", "/tsl/fw");
	xhr.send(new Blob([a]));
}

function onStart() {
	var d = document.getElementById('dialog');
	d.innerHTML = document.getElementById('u4').innerHTML;
	dnld().then(a => upld(a)).catch(e => alert(e.message));
}

function rs() {
	wsCmd(7);
	cc();
}

function wslinking() {
	if (wslink) return true;
	sd('nt');
	return false;
}

function cc() {
	document.getElementById('dialog').style.display = 'none';
}

function rf() {
	window.location.reload();
}

function cv() {
	var d = document.getElementById('cv').nextElementSibling;
	d.style.display = d.style.display == 'none' ? null : 'none';
}

function disc() {
	wsCmd(6);
}

function sd(i) {
	var d = document.getElementById('dialog');
	d.innerHTML = document.getElementById(i).innerHTML;
	d.style.display = 'flex';
}

function wp() {
	sd('wp');
	var d = document.getElementById('wpw');
	d.placeholder = document.getElementById('psk').value;
	d.addEventListener('keyup', function() {
		var d = document.getElementById('wps');
		this.value = this.value.replace(/[^\w_]/g,'');
		d.style.color = this.value.length > 7 ? '#fff' : '#686868';
	}, false);
}

function wps() {
	var t = document.getElementById('wpw');
	if (t.value.length > 7 && wsstr(9,t.value)) {
		ws.close();
		sd('np');
		document.getElementById('ps').innerHTML += t.value;
	}
}

function whw() {
	if (!wslinking()) return;
	sd('wh');
	var elem = document.getElementById('sig');
	for (var a of elem.children[0].children) {
		a.onclick = function() {
			var i, l;
			if (this.className == 'y') {
				return;
			}
			var p = this.parentElement;
			if (this == p.children[0]) {
				i = 1;
				l = [1,2,3,4,5,6,7,8,9,10,11];
			} else {
				i = 0;
				l = [36,40,44,48,149,153,157,161,165];
			}
			p.children[i].removeAttribute('class');
			this.className = 'chosen';
			var b = this.parentElement.nextElementSibling;
			b.innerHTML = document.getElementById('ba').innerHTML;
			for (var w of l) {
				b.innerHTML += '<div class="i" onclick="onsig(this)"><div class="s"></div><div class="t">' + w + '</div></div>';
			}
			onselsig();
		}
	}
	chtmp = channel;
	elem.children[0].children[chtmp < 15 ? 0 : 1].click();
}

function whs() {
	if (!wslinking()) return;
	var d = document.getElementById('swh');
	try {
		var s = document.getElementById('sig').firstElementChild;
		if (chtmp != channel) {
			channel = chtmp;
			ws.send(new Int16Array([4, 7, 6, chtmp]));
			ws.close();
		}
		for (var a of s.children) {
			if (a.className == 'chosen') {
				d.innerHTML = a.innerHTML;
			}
		}
		s = document.getElementById('wl');
		for (var a of s.children) {
			if (a.classList.contains('y')) {
				d.innerHTML += ' / ' + a.children[1].innerHTML;
			}
		}
	} catch (e) {
		d.innerHTML = 'N/A';
	}
	cc();
}

function icons(n) {
	if (!wslinking()) return;
	var i = document.getElementById('icons');
	i.children[n].className = 'chosen';
	i.children[n==0?1:0].removeAttribute('class');
	i.parentElement.style.height = n==0?'75px':'470px';
	if (n == 0) {
		var d = document.getElementById('icon').children[0];
		for (var i of d.children) {
			if (i.hasAttribute('class')) i.removeAttribute('class');
		}
		d = document.getElementById('inc');
		for (var i of d.children) {
			if (i.style.display == 'block') i.style.display = null;
		}
		d = document.getElementById('name');
		d.placeholder = 'Auto';
		if (wst) clearTimeout(wst);
		icon = '';
		wst = setTimeout(wsicon,2000);
	}
}

function wsicon() {
	var x = new Int16Array([12 + icon.length, 10]);
	var r = new Int8Array(4 + x[0]);
	r.set(new Int8Array(x.buffer), 0);
	x = document.getElementById('name');
	x = x.value == '' ? x.placeholder : x.value;
	r.set(str2arr(x), 4);
	x = [];
	for (var i of icon) {
		x.push(i.charCodeAt(0));
	}
	r.set(x, 16);
	ws.send(r);
}

function update_icons(a) {
	var d = document.getElementById('icon').children[0];
	var h = '';
	if (d.innerHTML != '') return;
	for (var k in a) {
		h += '<img src="icon/' + k + '.png" id="' + k + '"alt="' + a[k];
		h += icon == k ? '" class="active"/>' : '"/>';
	}
	d.innerHTML = h;
	for (var i of d.children) {
		i.onclick = function() {
			if (this.className == 'active') return;
			for (var i of this.parentElement.children) {
				if (i.hasAttribute('class')) i.removeAttribute('class');
			}
			this.className = 'active';
			a = document.getElementById('inc');
			for (var i of a.children) {
				if (i.style.display == 'block') i.style.display = null;
			}
			a = document.getElementById('name');
			a.placeholder = this.alt;
			a = document.getElementById(this.alt);
			if (a) a.style.display = 'block';
			if (wst) clearTimeout(wst);
			icon = this.id;
			wst = setTimeout(wsicon,2000);
		}
	}
	if (icon in a) {
		d = document.getElementById('name');
		d.placeholder = a[icon];
		d = document.getElementById(a[icon]);
		if (d) d.style.display = 'block';
	}
}

function psk(i) {
	i.type = i.type == 'text' ? 'password' : 'text';
	i.blur();
}

function test_pix(a) {
	var b = a.value.split(',');
	if (b.length == 4) {
		var c = new Int16Array([6, 11, Number(b[0]), Number(b[1])]);
		var d = new Int8Array(10);
		d.set(new Int8Array(c.buffer),0);
		d.set([Number(b[2]), Number(b[3])], 8);
		ws.send(d);
	}
}