var goTop = function () {
    document.body.scrollIntoView({
        behavior: 'smooth'
    })
}
var send = function (url, succ, fail) {
    var xhr = new XMLHttpRequest()
    xhr.open('get', 'https://polygon.triple.fi' + url, true)
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhr.onreadystatechange = function () {
        if (xhr.status == 200 && xhr.readyState == 4) {
            succ && succ()
        }
    }
    xhr.send()
}
var emailLoading = false
var onSendEmail = function () {
    if (emailLoading) return
    var input = document.getElementById('email-input')
    var value = input.value
    if (!value) return
    if (!/^([a-zA-Z0-9]+[_|_|\-|.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|_|.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,6}$/.test(value)) {
        return notie.alert({
            type: 'error',
            text: 'Please enter your email address correctly.'
        })
    }
    emailLoading = true
    var btn = document.getElementById('email-btn')
    btn.classList.add('dis')
    send('/api/odds/add_email?email=' + encodeURIComponent(value), function () {
        return notie.alert({
            type: 'success',
            text: 'Subscribed successfully!'
        })
    })
    setTimeout(() => {
        emailLoading = false
        btn.classList.remove('dis')
    }, 2000)
}
