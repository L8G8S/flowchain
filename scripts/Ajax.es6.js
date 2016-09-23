'use strict';

/**
 * Generic class to perform ajax requests.
 */
class Ajax {

    /**
     * Gets a JSON object from the given url.
     * @param  {String} url The url address to get the JSON object from.
     * @return {Promise} a Promise to handle asynchronous response.
     */
    static getJSON(url) {
        var xhr = new XMLHttpRequest();

        var p = new Promise(function(resolve, reject) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    }
                    else {
                        reject(xhr.responseText);
                    }
                }
            };
        });

        xhr.open('GET', url);
        xhr.send();

        return p;
    }

    static postJSON(url, params) {
        var xhr = new XMLHttpRequest();

        var p = new Promise(function(resolve, reject) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    }
                    else {
                        reject(xhr.responseText);
                    }
                }
            };
        });

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);

        return p;
    }
    
    /**
     * Gets the javascript code in the file at the given url.
     * @param  {String} url The url address to get the script file from.
     * @return {Promise} a Promise to handle asynchronous response.
     */
    static getScript(url) {
        var xhr = new XMLHttpRequest();

        var p = new Promise(function(resolve, reject) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    }
                    else {
                        reject(xhr.responseText);
                    }
                }
            };
        });

        xhr.open('GET', url);

        xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        xhr.setRequestHeader('Content-type', 'application/javascript');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

        xhr.send();

        return p;
    }
}