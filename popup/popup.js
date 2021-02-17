$('.chrext-upload-btn').on('click', function () {
    // chrome.runtime.sendMessage({name:'xiaoming'}, function (resp) {
    //     console.log('this is popup.js', resp);
    // });
    chrome.runtime.sendMessage({type:'upload'});
});

$('.chrext-synch-btn').on('click', function () {
    chrome.runtime.sendMessage({type:'download'});
});
