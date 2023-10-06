var ossCli = null;
var cpbox_region = null;
var cpbox_bucket = null;
var cpbox_dir = "/null";
var cpbox_retry = 0;
var txt;
var timer_count = 29;


function set_percent(v) {
	var s = (0 | v) + "%";
	var d = document.getElementById("fw_prog");
	d.style.width = s;
	d = document.getElementById("txt11");
	d.innerText = s;
}

async function download_fw(url) {
	var response = await fetch(url);
	var reader = response.body.getReader();
	var contentLength = +response.headers.get('Content-Length');
	var receivedLength = 0;
	var chunks = [];
	if (response.status != 200) {
		return '';
	}
	set_percent(0);
	console.log("start download");
	while(true){
		var{done, value}= await reader.read();
		if(done){
			break;
		}
		chunks.push(value);
		receivedLength += value.length;
		var p = receivedLength * 50 / contentLength;
		set_percent(p);
		console.log("download " + p * 2 + "%");
	}
	var chunksAll = new Uint8Array(receivedLength);// (4.1)
	var position = 0;
	for(var chunk of chunks){
		chunksAll.set(chunk, position);// (4.2)
		position += chunk.length;
	}
	set_percent(50);
	console.log("download complete");
	return chunksAll;
}

function show_progress(show) {
	var bd = document.getElementById("fw_prog_bd");
	if (bd) {
		bd.style.display = show ? "inline" : "none";
	}
}

function show_fwbtn(show) {
	var d = document.getElementById("txt12");
	if (d) {
		if (show) {
			d.className = d.className.slice(0, -18);
			d.href = "javascript:onUpdate();";
		} else {
			d.className += " weui-btn_disabled";
			d.href = "javascript:;";
		}
	}
}

function show_logbtn(show) {
	var d = document.getElementById("txt9");
	if (d) {
		if (show) {
			d.className = d.className.slice(0, -18);
			d.href = "javascript:onCommit();";
		} else {
			d.className += " weui-btn_disabled";
			d.href = "javascript:;";
		}
	}
}

var timer_8min = function (){
	if (timer_count < 0) {
		return;
	}
	set_percent(100 - timer_count / 4);
	if(timer_count > 0) {
		fetch("/cgi-bin/index.cgi?id=host").then(r => r.json()).then(j => {
			if (j.update == null) {
				timer_count --;
			} else if (j.update == 3) {
				timer_count = 0;
			} else if (j.update > 3) {
				if (cpbox_retry > 0) {
					var d = document.getElementById("txt11");
					if (d) { d.innerText = "fail: " + j.update; }
					show_fwbtn(true);
					show_progress(false);
					timer_count = -1;
				}
			} else {
				var v = j.sys.appver.split('.');
				timer_count --;
				if (j.update < 3 && v[1] != '1260') {
					cpbox_retry = 1;
					if (timer_count == 0) {
						var d = document.getElementById("txt11");
						if (d) { d.innerText = "fail: " + j.update; }
						show_fwbtn(true);
						show_progress(false);
						timer_count = -1;
					}
				}
			}
		}).catch(e => {
			if (cpbox_retry > 3) {
				var d = document.getElementById("txt11");
				if (d) { d.innerText = "fail..."; }
				show_fwbtn(true);
				show_progress(false);
				timer_count = -1;
			} else if (cpbox_retry > 0) {
				cpbox_retry ++;
			}
			timer_count --;
		});
		window.setTimeout(timer_8min, 4000);
	} else {
		d = document.getElementById("txt11");
		d.innerText = txt[3];
		show_progress(false);
	}
}

function upload_fw(blob) {
	var xhr = new XMLHttpRequest();
	var fd = new FormData();
	console.log("type = " + typeof(blob));
	fd.append("file", new Blob([blob]));
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			var d = document.getElementById("txt11");
			if (xhr.status === 200) {
				if (d) { d.innerText = txt[5]; }
				console.log(xhr.responseText);
				cpbox_retry = 0;
				timer_count = 119;
				timer_8min();
			} else {
				if (d) { d.innerText = txt[6]; }
				console.log(xhr.status);
				show_fwbtn(true);
				show_progress(false);
			}
		}
	};
	xhr.upload.addEventListener("progress", function(e) {
		var p = (e.loaded / e.total) * 20;
		set_percent(50 + p);
		console.log("upload " + p * 2 + "%");
	}, false);
	xhr.upload.addEventListener('loadstart', function (e) {
		console.log("start upload");
	});
	xhr.open("POST", "/cgi-bin/index.cgi?id=upload");
	xhr.send(fd);
}

function update_fw(url) {
	show_fwbtn(false);
	show_progress(true);
	download_fw(url).then(blob => {
		upload_fw(blob);
	}).catch(err => {
		var d = document.getElementById("txt11");
		if (d) { d.innerText = "fail: " + err; }
		show_fwbtn(true);
		show_progress(false);
	});
	console.log("start update_fw");
}

function get_content_type(req) {
	var type = req.getResponseHeader("Content-Type").split(';')[0].split('/');
	console.log("res type = " + req.responseType);
	return type[type.length - 1];
}

function get02str(s) {
	return ('0' + s).slice(-2);
}

function update_log(j) {
	var d = new Date();
	var date = get02str(d.getUTCFullYear()) + 
		get02str(d.getUTCMonth() + 1) + 
		get02str(d.getUTCDate()) +
		get02str(d.getUTCHours()) + 
		get02str(d.getUTCMinutes()) + 
		get02str(d.getUTCSeconds()) + 
		('00' + d.getUTCMilliseconds()).slice(-3);
	show_logbtn(false);
	
	fetch("/cgi-bin/index.cgi?id=logcat").then(r => r.blob()).then(async b => {
		const n = "logcat" + cpbox_dir + '/log_' + date + '.gz';
		const result = await getOSSCli().then(c => c.put(n, b));
		console.log(n + ":" + result);
	}).then(async function() {
		const n = "logcat" + cpbox_dir + '/log_' + date + '.log';
		const m = new OSS.Buffer(JSON.stringify(j));
		const result = await getOSSCli().then(c => c.put(n, m));
		console.log(n + ":" + result);
		alert(txt[0]);
	}).catch(err => {
		console.log(err)
		alert(txt[1] + ":" + err);
	});
}

async function update_sts() {
	var d = new Date();
	var url = "/cgi-bin/index.cgi?id=sts&time=" + d.toISOString();
	url = await fetch(url).then(r => r.json()).then(j => {
		return j.url;
	}).catch(e => {
		console.log("get sts url: " + e);
		return null;
	});
	
	if (url) {
		return fetch(url).then(r => r.json()).then(j => { 
			var c = j.Credentials;
			return {
				accessKeyId: c.AccessKeyId,
				accessKeySecret: c.AccessKeySecret,
				stsToken: c.SecurityToken
			}
		}).catch(err => {
			console.log(err);
			return null;
		});
	} else {
		return null;
	}
}

async function getOSSCli() {
	if (ossCli) {
		return ossCli;
	}
	if (cpbox_region == null) {
		alert("no region");
	} else if (cpbox_bucket == null) {
		alert("no bucket");
	} else {
		ossCli = await update_sts().then(r => {
			return new OSS({
				region: cpbox_region,
				accessKeyId: r.accessKeyId,
				accessKeySecret: r.accessKeySecret,
				stsToken: r.stsToken,
				refreshSTSToken: update_sts,
				refreshSTSTokenInterval: 3000000,
				bucket: cpbox_bucket
			});
		}).catch(err => console.log(err));
	}
	return ossCli;
}

function cpbox_init(j) {
	var v = j.sys.appver.split('.');
	cpbox_dir = '/' + v[1];
	if (v[2] == '2') {
		cpbox_bucket = "cpbox-abroad";
		cpbox_region = "oss-us-west-1";
	} else {
		cpbox_bucket = "cpbox";
		cpbox_region = "oss-cn-shenzhen";
	}
	txt = j.res.val;
}

function cpbox_geturl() {
	return "https://" + cpbox_bucket + "." + cpbox_region + ".aliyuncs.com" + cpbox_dir + "/version.json";
}

function findVer() {
	return txt[2];
}

function lastedVer() {
	return txt[3];
}

function updateAPN(s) {
	fetch('/cgi-bin/index.cgi?id=apn', {
		method: 'post',
		body: s,
		headers: {'Content-Type': 'application/octet-stream'}
	}).then(r => {
		if (r.status == 200) {
			return r.json();
		}
		throw new Error(r.status + ' ' + r.statusText);
	}).then(j => {
		if (j.code == 0) alert(txt[0]);
		else alert(txt[1] + '\n' + JSON.stringify(j));
	}).catch(e => {
		alert(txt[1] + '\n' + e.name + '\n' + e.message);
	});
}