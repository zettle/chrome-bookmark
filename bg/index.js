// chrome.contextMenus.create({
//     type: 'normal', // normal-普通文本/checkbox-多选/radio-单选/separator-分割线
//     title: '我是一个normal标题',
//     // all-/page-/frame-/selection-/link-/editalbe-/image-/video-/audio-/launcher-/brower_action-/page_action-
//     contexts: ['selection', 'link']
// }, function () {
//     console.log('haha');
// });

class Books {
    api = 'https://zettle.top';
    uploadApi = this.api + '/chromebooks/save'; // 上传的接口
    downApi = this.api + '/chromebooks/get'; // 下载的接口
    /***********
     * 弹窗
     ***********/
    alert (title, message, isSucess) {
        chrome.notifications.create({
            type: 'basic',
            title,
            message,
            iconUrl: isSucess ? './img/sucess.png' : './img/fail.png'
        })
    }
    /***********
     * 获取所有书签
     ***********/
    async getAll () {
        return new Promise(resolve => {
            chrome.bookmarks.getTree(function(bookmarkArray){
                resolve(bookmarkArray[0].children[0].children); //获取所有书签栏
            });
        });
    }
    /***********
     * 将原书签数据转为比较干净的数组
     ***********/
    filterBook (books, parentBookArr) {
        books.forEach(bookInfo => {
            const {index, title, url, children} = bookInfo;
            const newBook = {index, title};
            if (url) {
                newBook.url = url;
            }
            parentBookArr.push(newBook);
            if (children) {
                newBook.children = [];
                this.filterBook(children, newBook.children);
            }
        });
    }
    /***********
     * 清空所有书签
     ***********/
    async removeAll () {
        const books = await this.getAll();
        return new Promise(resolve => {
            books.forEach(book => {
                chrome.bookmarks.removeTree(book.id);
            });
            resolve();
        });
    }
    /***********
     * 上传到服务器上
     ***********/
    async upload () {
        const allBooks = await this.getAll();
        const list = [];
        this.filterBook(allBooks, list);
        const resp = await axios.post(this.uploadApi, {list: JSON.stringify(list)});
        if (resp.data.code === 0) {
            this.alert('上传成功', '同步到服务器成功', true);
        }
    }
    /***********
     * 安装数组开始创建书签
     ***********/
    async createBookTree (bookArr, parentId='1') {
        bookArr.forEach(bookInfo => {
            const { index, title, url, children } = bookInfo;
            if (url) {
                // 说明是书签
                chrome.bookmarks.create({ index, parentId, title, url });
            } else if (children) {
                // 说明是目录，创建文件夹，成功后再继续遍历里面的children
                chrome.bookmarks.create({ index, parentId, title}, (folder) => {
                    this.createBookTree(children, folder.id);
                });
            }
        });
    }
    /***********
     * 从服务器同步数据
     ***********/
    async download () {
        const resp = await axios.get(this.downApi);
        if (resp.data.code !== 0) {
            return false;
        }
        await this.removeAll(); // 清除所有书签
        console.log(resp.data.list);
        this.createBookTree(resp.data.list); // 逐级创建书签
        setTimeout(() => {
            this.alert('', '本地已更新', true);
        }, 1000);
    }
}

chrome.runtime.onMessage.addListener(async function(request, sender, callback) {
    if (request.type === 'upload') {
        new Books().upload();
    } else if (request.type === 'download') {
        new Books().download();
    }
});
