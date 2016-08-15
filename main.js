/**
 * Created by Вероника on 14.08.2016.
 */
'use strict';

// "Хелпер" для соединения имени и фамилии
Handlebars.registerHelper( 'concat', function(f,l) {
    return f + " " + l;
});

new Promise(function (resolve) {
    // Если страница загружена перевести промис в состояние resolved
    if(document.readyState == "complete"){
        resolve();
    }
    else {
        window.onload = resolve;
    }
}).then(function () {
    // Затем инициализировать приложение
    return new Promise(function (resolve, reject) {
        VK.init({
            apiId: 5583715
        });
        // Попробовать залогиниться
        VK.Auth.login(function (response) {
            // Если пользователь залогинился перевести промис в состояние resolved
            if (response.session){
                resolve(response);
            }
            else{
                reject(new Error("Не удалось авторизоваться"));
            }
        }, 2);
    });
}).then(function () {
    return new Promise(function (resolve, reject) {
        // Получить список друзей пользователей, включая фото и дату рождения
        VK.api('friends.get', {'fields':'photo_50,bdate', 'v': '5.53'}, function (response) {
            if (response.error){
                reject(new Error(response.error.error_msg));
            }
            else{
                // Если запрос успешен получить шаблон и контейнер
                let mainTemplate = document.getElementById('main-template'),
                    results = document.getElementById('results'),
                    friends = response.response.items,
                    source = mainTemplate.innerHTML,
                    templateFn = Handlebars.compile(source),
                    friendsWDate = [],
                    friendsWYDate = [],
                    friendsODate = [];

                // Проходим циклом по списку друзей
                for (let i = 0; i < friends.length; i++){
                    // Если в дате рождения есть день, месяц, год
                    if (friends[i].bdate && friends[i].bdate.split('.').length == 3) {
                        // Преобразуем bdate в дату, которую воспримет new Date
                        friends[i].date = friends[i].bdate.split('.').reverse();
                        // Посчитаем возраст
                        friends[i].age = Math.abs(new Date(new Date() - new Date(friends[i].date))
                                .getUTCFullYear() - 1970);
                        // Добавим этих друзей в список друзей с датой рождения
                        friendsWDate.push(friends[i]);
                    }
                    else if (friends[i].bdate && friends[i].bdate.split('.').length == 2) {
                        // Если в дате есть число и месяц добавим в список друзей с датой рождения,
                        //  в которой не указан год
                        friendsWYDate.push(friends[i]);
                    }
                    else{
                        // Всех остальных добавим в другой список.
                        friendsODate.push(friends[i]);
                    }
                }

                // Отсортируем массив друзей по датам рождения
                friendsWDate.sort(function (a,b) {
                    return new Date(b.date) - new Date(a.date);
                });

                // Добавим друзей, у которых не указан год рождения в список
                friendsWDate = friendsWDate.concat(friendsWYDate);
                // Добавим друзей, у которых не указана дата рождения
                friendsWDate = friendsWDate.concat(friendsODate);

                // Вставить в соответствие с шаблоном информацию о друзьях
                // Если списки друзей есть в localstorage
                // Иначе составить список из загруженных данных
                if('friendsWDate' in window.localStorage && 'checkedFriends' in window.localStorage){
                    results.innerHTML = templateFn({
                        list: JSON.parse(window.localStorage.friendsWDate),
                        checkedList: JSON.parse(window.localStorage.checkedFriends)
                    });
                }
                else results.innerHTML = templateFn({ list: friendsWDate });

                resolve(friendsWDate);
            }
        })
    });
}).then(function (friendsWDate) {
    let resultDiv = document.getElementById("results"),
        friendList = document.getElementById("friendList"),
        friendListChecked = document.getElementById("friendListChecked"),
        checkedFriends = [];

    let hideShow = function (e, liFriendListChecked) {
        for (let i = 0; i < liFriendListChecked.length; i++) {
            if (liFriendListChecked[i].textContent.toLowerCase().indexOf(e.target.value.toLowerCase()) == -1) {
                liFriendListChecked[i].style.display = "none";
            }
            else liFriendListChecked[i].style.display = "block";
        }
    };

    resultDiv.addEventListener('click', function (e) {
        let mainTarget = e.target,
            friendList = document.getElementById("friendList"),
            friendListChecked = document.getElementById("friendListChecked"),
            friendName = document.getElementById("friendName"),
            groupName = document.getElementById("groupName");

        if(mainTarget.getAttribute("class") == "changeButton"){
            if(mainTarget.closest("ul").getAttribute("id") == "friendList"){
                mainTarget.parentElement.parentElement.removeChild(mainTarget.parentElement);
                friendListChecked.appendChild(mainTarget.parentElement);
                for (let i = 0; i < friendsWDate.length; i++) {
                    if(friendsWDate[i].id == mainTarget.parentElement.getAttribute('id')){
                        checkedFriends.push(friendsWDate[i]);
                        friendsWDate.splice(i,1);
                    }
                }
            }
            else if(mainTarget.closest("ul").getAttribute("id") == "friendListChecked"){
                mainTarget.parentElement.parentElement.removeChild(mainTarget.parentElement);
                friendList.appendChild(mainTarget.parentElement);
                for (let i = 0; i < checkedFriends.length; i++) {
                    if (checkedFriends[i].id == mainTarget.parentElement.getAttribute('id')) {
                        friendsWDate.push(checkedFriends[i]);
                        checkedFriends.splice(i, 1);
                    }
                }
            }
        }
        else if(mainTarget.getAttribute("class") == "saveButton"){
            window.localStorage.friendsWDate = JSON.stringify(friendsWDate);
            window.localStorage.checkedFriends = JSON.stringify(checkedFriends);
        }
    });

    resultDiv.addEventListener('mousedown', function (e) {
        let mainTarget = e.target,
            offsetX = e.offsetX,
            offsetY = e.offsetY;

        if(mainTarget.getAttribute("class") == "name"){
            let element = document.createElement('div'),
            getPosition = (el) => {
                var xPos = 0;
                var yPos = 0;

                while (el) {
                    // for all other non-BODY elements
                    xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
                    yPos += (el.offsetTop - el.scrollTop + el.clientTop);

                    el = el.offsetParent;
                }
                return {
                    x: xPos,
                    y: yPos
                };
            },
            mouseMve = (e) => {
                if (element) {
                    element.style.top = (e.clientY - offsetY) + 'px';
                    element.style.left = (e.clientX - offsetX) + 'px';
                }
            },
            mouseUp = (e) => {
                let position = getPosition(friendListChecked);

                if (e.clientX > position.x && e.clientY > position.y
                    && e.clientX < position.x + friendListChecked.offsetHeight
                    && e.clientY < position.y + friendListChecked.offsetWidth){
                    var evt = document.createEvent("MouseEvents");
                    evt.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0,
                        false, false, false, false, 0, null);

                    mainTarget.lastElementChild.dispatchEvent(evt);
                }
                document.body.removeChild(element);
            };

            element.style.backgroundColor = "white";
            element.style.position = "absolute";
            element.style.width = mainTarget.offsetWidth + 'px';
            element.style.height = mainTarget.offsetHeight + 'px';
            element.style.top = (e.clientY - e.offsetY) + 'px';
            element.style.left = (e.clientX - e.offsetX) + 'px';

            element.innerHTML = mainTarget.outerHTML;
            document.body.appendChild(element);
            element.addEventListener("mousemove", mouseMve);
            element.addEventListener("mouseup", mouseUp);
        }
    });

    friendName.addEventListener("input", (e) => {
        let liFriendListChecked = friendList.children;

        hideShow(e, liFriendListChecked);
    });

    groupName.addEventListener("input", (e) => {
        let liFriendListChecked = friendListChecked.children;

        hideShow(e, liFriendListChecked);
    });
}).catch(function (e) {
    alert(`Возникла ошибка: ${e.message}`);
});
