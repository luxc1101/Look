from selenium import webdriver
import webbrowser
import time
import random
import requests
from bs4 import BeautifulSoup as bs
import pandas as pd
import re
import os
import emojis

chrome_path = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
web_path = 'https://look.163.com/live?id=270803279'
# https://look.163.com/live?id=316155009
# https://look.163.com/live?id=73355245
# https://look.163.com/live?id=52446485
# https://look.163.com/live?id=270803279


def format_response(weather):
    try:
        name = weather['name']
        desc = weather['weather'][0]['description']
        temp = round((weather['main']['temp']-32)*5/9,2)
        final_str = '城市: %s 情况: %s 温度: %s' % (name, desc, temp)
    except:
        final_str = 'cutey, 你确定是这个地方☹?!'
    return final_str


def get_weather(city):
    weather_key = 'a4aa5e3d83ffefaba8c00284de6ef7c3'
    url = 'https://api.openweathermap.org/data/2.5/weather'
    params = {'APPID': weather_key, 'q': city, 'units': 'imperial'}
    response = requests.get(url, params=params)
    weather = response.json()
    return format_response(weather)


def send_txt (content , s_time):
    text = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[1]/input")
    text.send_keys(content)
    send = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[2]").click()
    time.sleep(s_time)


driver = webdriver.Chrome()
driver.get(web_path)
time.sleep(3)

# login
driver.find_element_by_xpath("//*[@id='ssr-app']/div/div[1]/div[3]").click()
username = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[1]/div/div/div[2]/div/input")
username.send_keys("18615102720")
password = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[2]/div/div/input")
password.send_keys("ironman691101")
checkbox = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/p/label/span").click()
Login_Button = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[4]/a").click()
time.sleep(7)

# User_Manual = ["Hello i am Genie of the Lamp",'today is a big day','i am not dumb anymore']
# User_Manual = ["Hello i am Genie of the Lamp"]
# for txt in User_Manual:
#     print(txt)
#     send_txt(txt, 2)

sleep_time = 10
chat = 30
verbot = emojis.encode(':no_entry:')
# ❤☝⇧❀☑
i = 0
a = 0
f = 0
content = ['first']
# blacklist '_张半仙-'
bl = ['_张半仙-']
nth = []

txt = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[1]").text
print(txt)
owner = driver.find_element_by_class_name('nickname_3pHT9').text
print(owner.split(':'))
while True:
    time.sleep(2)
    print('.........')
    print(i)
    print(f)
    # if f >= 150:
    #     i = 0
    #     f = 0
    #     driver.refresh()
    #     time.sleep(8)
    if f <= 1:
        try:
            txt = driver.find_element_by_xpath(
                "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]".format(i)).text
            if content[-1] != txt:
                content.append(txt)
                print(txt)
                print(content)
                f += 1
            else:
                try:
                    guest = driver.find_element_by_xpath(
                        "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[2]".format(a + 1)).text.split(
                        ':')[0]
                    txt = driver.find_element_by_xpath(
                        "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]".format(a + 1)).text
                    a = a + 1
                    if guest != 'Genie_Lamp':
                        print(txt)
                        print(guest)
                        if guest in bl:
                            send_txt('你该洗洗睡了{}'.format(guest), 1)
                            send_txt('bist du blind order taub! Schwachkopf:) {}'.format(guest), 1)


                        if ((txt.find('抱') != -1) or (txt.find('嘴') != -1) or (txt.find('亲') != -1) or ()) and (guest != '小阿酱的明明') :
                            send_txt('keep corona distance for safety{}{}'.format(verbot,guest), 1)
                        else:
                            pass

                        if txt.find('老婆') != -1:
                            send_txt('halts maul! {}'.format(guest),1)

                        if '送了' in txt:
                            gift = txt.replace("了", '的')
                            send_txt('❤蟹蟹{}{}'.format(guest, gift), 1)

                        if '关注了主播' in txt:
                            send_txt('☑蟹蟹关注！{}'.format(guest), 1)

                        if '加入了' in txt:
                            send_txt('❀我还以为下次一定呢！{}'.format(guest), 1)

                        if '粉团升' in txt:
                            send_txt('{}你又进步了！{}'.format('⇧', guest), 1)

                        if txt.split(' ')[0] == '@Genie_Lamp':
                            if guest in [owner, 'luue']:
                                if txt.split(' ')[1] == 'chat':
                                    send_txt('as you wish, my master {}'.format(guest), 1)
                                if txt.split(' ')[1] == 'gh':
                                    send_txt('Gesundheit, my master {}'.format(owner), 1)
                                if txt.split(' ')[1] == 'love':
                                    send_txt("love u too!'❤'my master", 1)
                                if txt.split(' ')[1] == '天气':
                                    try:
                                        city = ' '.join(txt.split(' ')[2:])
                                        send_txt(get_weather(city), 1)
                                    except:
                                        pass
                                if txt.split(' ')[1] == 'game':
                                    max_num = 50
                                    num = int(random.randint(1,max_num))
                                    send_txt('you have to guess the a number between 1 and {}'.format(max_num),1)
                                    guess_game = ['first']
                                    j = a
                                    k = j
                                    start = True

                                    while start:
                                        time.sleep(2)
                                        print('+++++')
                                        try:
                                            txt = driver.find_element_by_xpath(
                                                "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]".format(
                                                    k)).text
                                            if guess_game[-1] != txt:
                                                guess_game.append(txt)
                                                print(txt)
                                                print(guess_game)
                                            else:
                                                try:
                                                    guest = driver.find_element_by_xpath(
                                                        "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[2]".format(
                                                            j+1)).text.split(
                                                        ':')[0]
                                                    txt = driver.find_element_by_xpath(
                                                        "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]".format(
                                                            j+1)).text
                                                    j = j+1
                                                    print(txt)
                                                    if isinstance(int(txt.split(' ')[1]), int):
                                                        guess_num = int(txt.split(' ')[1])
                                                        if guess_num < num:
                                                            send_txt('Your guess is low {}'.format(guest),1)
                                                        if guess_num > num:
                                                            send_txt('Your guess is high {}'.format(guest),1)
                                                        if guess_num == num:
                                                            send_txt('you are the man {}'.format(guest),1)
                                                            a = j+1
                                                            start = False
                                                    else:
                                                        pass
                                                except:
                                                    pass
                                        except:
                                            pass

                                if txt.split(' ')[1] not in ['chat','gh','love','天气','reset','game']:
                                    try:
                                        int(txt.split(' ')[1])
                                    except:
                                        send_txt('Hello, my master {}'.format(guest), 1)
                            else:
                                if txt.split(' ')[1] != '天气':
                                    try:
                                        int(txt.split(' ')[1])
                                    except:
                                        send_txt('Hello, my little cutey {}'.format(guest), 2)
                                        send_txt("im currently at work, please dont bother me!", 1)
                                else:
                                    try:
                                        city = ' '.join(txt.split(' ')[2:])
                                        send_txt(get_weather(city), 1)
                                    except:
                                        pass

                        if ("晚安" in txt) and (guest != 'Genie_Lamp'):
                            send_txt('Good Night!', 1)
                        if ("good night" in txt) and (guest != 'Genie_Lamp'):
                            send_txt('Good Night!', 1)

                        if (txt == '进入了直播间') and (guest not in bl):
                            txt_l = [
                                'Genie以为你再也不会来了{}！'.format(guest),
                                '欢迎{}进入直播间！'.format(guest),
                                '等你好久了{}, 怎么才来！'.format(guest)
                            ]
                            random_id = random.randint(0, len(txt_l) - 1)
                            send_txt('☺'+ txt_l[random_id], 1)

                        if (txt.split(' ')[0] == '@Genie_Lamp') and (guest in [owner]):
                            txt_l = [
                                "anyway Genie will stand behind you! ",
                                "anyone can betray u except Genie!*mic drop!* ",
                                "always ready to serve my master! ",
                                'finally you text me! '
                            ]
                            random_id = random.randint(0, len(txt_l) - 1)
                            try:
                                int(txt.split(' ')[1])
                            except:
                                send_txt(txt_l[random_id] + guest, 1)

                        if (txt.split(' ')[0] == '@Genie_Lamp') and (txt.split(' ')[1] == 'chat') and (guest in [owner, 'luue']):
                            for i in range(chat):
                                print(i)
                                if i == (chat - 1):
                                    time.sleep(1)
                                    send_txt("overheating!!! Let's take a break!", 0)
                                else:
                                    time.sleep(1)
                                    txt_l = [
                                        'what can i say...',
                                        'Lao De sucks!',
                                        'wasup!wasup!',
                                        'no drugs! no porns! no gambling!',
                                        "That's b*llsh*t!",
                                        'look at that, what a poor guy!',
                                        'everybody lights up!',
                                        "love u! let's corona party!",
                                        'Excuse me!',
                                        "nobody's fault but mine",
                                        'hold on hold on!!!',
                                        'Guess what!',
                                        'as you wish!',
                                        'Gesundheit!',
                                        'you are so mean to me！',
                                        "lieb' dich Lao Ma",
                                        "Eyyo, what's going on Digga!",
                                        'i got it! f**k outta here!'
                                    ]
                                    random_id = random.randint(0, len(txt_l) - 1)
                                    send_txt(txt_l[random_id], 0)
                                    print(txt_l[random_id])
                    else:
                        print('Genie')
                except:
                    print('None')

        except:
            i += 1
            a = i
    else:
        send_txt("Loading ✈ ✈ ✈ ✈ ✈", 1)
        time.sleep(1)
        i = 0
        f = 0
        driver.refresh()
        time.sleep(8)
    print(a)