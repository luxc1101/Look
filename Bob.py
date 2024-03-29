from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import webbrowser
import time
import random
import requests
from bs4 import BeautifulSoup as bs
import pandas as pd
import re
import os
import emojis
import nltk
# nltk.download()
from nltk.stem.lancaster import LancasterStemmer
stemmer = LancasterStemmer()
import numpy as np
import tensorflow as tf
from tensorflow import keras
import random
import json
import pickle
from googletrans import Translator
from textblob import TextBlob
import pyaztro
from datetime import datetime
# from twilio.rest import Client
###########################################################################

translator = Translator()

chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
web_path = 'https://look.163.com/live?id=10102499'
# https://look.163.com/live?id=319150589
# https://look.163.com/live?id=387122108
# https://look.163.com/live?id=10102499
# https://look.163.com/live?id=52446485
# https://look.163.com/live?id=194409486
# Maymaymay-_
# https://look.163.com/live?id=43733933&position=37

########################################################################################
# wheel game
#--------------------------------
NUM = '0123456789'

def spinWheel(n1,n2,n3):
    wheel = ['money']*n1 + ['破产']*n2 + ['轮空']*n3
    random.Random(4).shuffle(wheel)
    # print(wheel)
    return random.choice(wheel)

def RandomNumGenerator():
    rand_num =  [str(random.randint(0, 10)) for _ in range(11)]
    rand_num_str = ''.join(rand_num)
    return rand_num_str

def numbercount(num_str):
    d = {}
    for n in range(10):
      if str(n) not in d and str(n) in num_str:
        d[str(n)] = num_str.count(str(n))
      else:
        d[str(n)] = 0
    return d

def cash_class(str_num_dict, guessed):
    if str_num_dict[guessed] >= 3:
      return 1
    elif str_num_dict[guessed] >= 2:
      return 2
    elif str_num_dict[guessed] >= 1:
      return 3
    else:
      return None

def obscurePhrase(rand_num_str, guessed):
    rv = ''
    for s in rand_num_str:
        if (s in NUM) and (s not in guessed):
            rv = rv+'_'
        else:
            rv = rv+s
    return rv

def showBoard(obscuredPhrase, guessed):
    return "Num:{} Guessed:{}".format(obscuredPhrase, ''.join(sorted(guessed)))

class WOFPlayer:
    def __init__(self, name):
        self.name = name
        self.prizeMoney = 0
    def addMoney(self, amt):
        self.prizeMoney = self.prizeMoney + amt
    def goBankrupt(self):
        self.prizeMoney = 0
    def __str__(self):
        return '{} (${})'.format(self.name, self.prizeMoney)

class WOFHumanPlayer(WOFPlayer):
    def __init__(self,name):
        WOFPlayer.__init__(self,name)
    def getMove(self, obscuredPhrase, guessed):
        # send text
        send_txt("{} has (${})".format(self.name,self.prizeMoney),1)
        # send text
        send_txt(showBoard(obscuredPhrase, guessed),1)
        send_txt("Guess a number 0-9 or type 'exit'/'pass': ",1)

########################################################################################
###CHATBOT###
with open("C:/Code/Look/intents.json") as file:
    data = json.load(file)

try:
    with open('data.pickle','rb') as f:
        words, labels, trainig, output = pickle.load(f)

except:

    words = []
    labels = []
    docs_X = []
    docs_y = []

    for intent in data['intents']:
        for pattern in intent['patterns']:
            wrds = nltk.word_tokenize(pattern)
            words.extend(wrds)
            docs_X.append(wrds)
            docs_y.append(intent['tag'])

        if intent['tag'] not in labels:
            labels.append(intent['tag'])



    words = [stemmer.stem(w.lower()) for w in words if w != "?"]
    words = sorted(list(set(words)))
    labels = sorted(labels)

    #print(words)
    print(labels)
    #print(docs_X)
    #print(docs_y)

    trainig = []
    output = []

    # out_empty = [0 for _ in range(len(labels))]

    for x,doc in enumerate(docs_X):
        bag = []

        wrds = [stemmer.stem(w) for w in doc]

        for w in words:
            if w in wrds:
                bag.append(1)
            else:
                bag.append(0)
        # output_row = out_empty[:]
        # output_row[labels.index(docs_y[x])] = 1
        # print(labels.index(docs_y[x]))

        trainig.append(bag)
        output.append(labels.index(docs_y[x]))

    trainig = np.array(trainig)
    output = np.array(output)

    with open('data.pickle', 'wb') as f:
        pickle.dump((words, labels, trainig, output), f)

print(trainig)
print(type(output))
print(trainig.shape)

model = keras.models.Sequential([
    keras.layers.Dense(15, activation='relu', input_shape = trainig.shape[1:]),
    keras.layers.Dense(10, activation='relu'),
    keras.layers.Dense(len(labels), activation='softmax'),
])

print(model.summary())

model.compile(loss="sparse_categorical_crossentropy",
              optimizer="sgd",
              metrics=["accuracy"])
checkpoint_cb = keras.callbacks.ModelCheckpoint("C:/Code/Look/chatbot.h5")

try:
    model = keras.models.load_model("C:/Code/Look/chatbot.h5")
except:
    history = model.fit(trainig, output, epochs=1000, batch_size=8 ,callbacks=[checkpoint_cb])
    model = keras.models.load_model("C:/Code/Look/chatbot.h5")


def bag_of_words(s, words):
    bag = [0 for _ in range(len(words))]

    s_words = nltk.word_tokenize(s)
    print(s_words)
    s_words = [stemmer.stem(w.lower()) for w in s_words]


    for se in s_words:
        for i, w in enumerate(words):
            if w == se:
                print(w)
                bag[i] = 1

    return np.array(bag).reshape(1,len(bag))
def auto_chat(inp):
    # try:
    # s = translator.translate(inp, dest='en').text
    s = inp
    # language = TextBlob(inp).detect_language()
    # if language != 'en':
    #     return '☹ master has no language other than en. to teach'
    # else:
    a = bag_of_words(s=s, words=words)
    results = np.argmax(model.predict(a), axis=-1)
    tag = labels[results[0]]
    for tg in data['intents']:
        if tg['tag'] == tag:
            responses = tg['responses']
    return random.choice(responses)
    # except:
    #     # a = bag_of_words(s = inp, words = words)
    #     # results = np.argmax(model.predict(a), axis=-1)
    #     # tag = labels[results[0]]
    #     # for tg in data['intents']:
    #     #     if tg['tag'] == tag:
    #     #         responses = tg['responses']
    #     return '完了 没看懂'
print(auto_chat('机器人'))
#########################################################################################
# account_sid = 'AC2bf19ed6a70a92464b7f58ae6ce1b529'
# auth_token = '1d346113079729023118d77a72b58ca7'
# client = Client(account_sid, auth_token)
# laoma = ''
# laode = ''
# call = False
# while call:
#     now = datetime.now()
#     current_time = now.strftime("%H:%M:%S")
#     # print(current_time)
#     if current_time == '17:05:00':

#         try:
#             # message = client.messages.create(
#             #                         body='love u too mom',
#             #                         from_='+16504198034',
#             #                         to = laoma
#             # )
#             call = client.calls.create(
#                                     url='http://demo.twilio.com/docs/voice.xml',
#                                     to = laoma,
#                                     from_='+16504198034'
#                                         )
#             # print(message)
#             print(call.sid)
#             call = False
#         except:
#             print('auto call failed')
#             call = False
# path ='F:/Python_youtube/Look-master/json file/Gift'
# def screen_shot(path,gift):
#     os.makedirs('{}/{}'.format(path,time.strftime('%m-%d',time.localtime(time.time()))), exist_ok= True)
#     driver.get_screenshot_as_file('{}/{}/{}_{}.png'.format(
#                                     path,
#                                     time.strftime('%m-%d', time.localtime(time.time())),
#                                     gift,
#                                     time.strftime('%m-%d-%H-%M-%S',time.localtime(time.time()))))

def horoscope_(sign, day):
    horoscope = pyaztro.Aztro(sign=sign, day=day)
    date = str(horoscope.current_date)
    star_sign = horoscope.sign
    date_range = "从{}到{}".format(str(horoscope.date_range[0]).split(' ')[0], str(horoscope.date_range[1]).split(' ')[0])
    compatibility = horoscope.compatibility
    lucky_time = horoscope.lucky_time
    lucky_number = horoscope.lucky_number
    # mood = translator.translate(horoscope.mood, dest='zh-cn').text
    mood = horoscope.mood
    description = translator.translate(horoscope.description, dest='zh-cn').text

    return date, star_sign, date_range, compatibility, lucky_time, lucky_number, mood, description

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
    # text = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[1]/input")
    text = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[1]/textarea")
    text.send_keys(content)
    # send = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[2]").click()
    send = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[2]").click()
    time.sleep(s_time)
# C:\Program Files\Google\Chrome\Application
# chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\Code\Look\Chromeprofile"
opt = Options()
opt.add_experimental_option("debuggerAddress","localhost:9222",)
driver = webdriver.Chrome(chrome_options=opt)
driver.get(web_path)
time.sleep(3)

# detect the heat value to make sure that the laoma is streaming
# if the heat != 10 status will be changed, else Bob will sleep 300s for next detection
status = True
while status:
    heat = int(driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[1]/div[1]/div[2]/div[1]/div[3]").text)
    if heat != 10:
        status = False
        print('live')
    else:
        time.sleep(180)
        driver.refresh()
        time.sleep(10)
#####################################################################################################################        
# wechat login
# driver.find_element_by_xpath("//*[@id='easy-app']/div/div[1]/div[3]").click()
# checkbox = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/p/label/span").click()
# driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[2]/ul/li[1]/div").click()
time.sleep(5)
#####################################################################################################################
# login
# driver.find_element_by_xpath("//*[@id='ssr-app']/div/div[1]/div[3]").click()
# username = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[1]/div/div/div[2]/div/input")
# username.send_keys("")
# password = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[2]/div/div/input")
# password.send_keys("")
# checkbox = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/p/label/span").click()
# Login_Button = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[4]/a").click()
# time.sleep(15)
####################################################################################################################

chat = 30
verbot = emojis.encode(':no_entry:')
balloon = emojis.encode(':balloon:')
crown = emojis.encode(':crown:')
# User_Manual = ["hi im coming", "i have a new function","@VectorBob 星座 libra today","yesterday or tomorrow"]
User_Manual = ["hi im coming"]
for txt in User_Manual:
     print(txt)
     send_txt(txt, 1)
     time.sleep(2)

# #### send gift ####
# for _ in range(840):
#     fire = driver.find_element_by_xpath("//*[@id='panel-root']/div[1]/div[2]/div/div[1]").click()
#     time.sleep(0.5)
#     print('send')

# ❤☝⇧❀☑
i = 0
a = 0
f = 0
content = ['first']
# blacklist '_张半仙-'
bl = ['_张半仙-']

# txt = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[1]").text
txt = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[1]/div[1]/div[2]/div[1]/div[1]").text
print(txt)
owner = driver.find_element_by_class_name('nickname_3IoL7').text
print(owner)
# print(owner.split(':'))
while True:
    time.sleep(1.5)
    print('.........')
    print(i)
    print(f)
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
                    try:
                        pktxt = driver.find_element_by_xpath(
                            "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]".format(a + 1)).text
                        if 'PK进行中' in pktxt:
                            print(pktxt)
                            a = a + 1
                        else:
                            pass
                    except:
                        pass
                    guest = driver.find_element_by_xpath(
                        "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[2]".format(a + 1)).text.split(
                        ':')[0]
                    txt = driver.find_element_by_xpath(
                        "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]".format(a + 1)).text
                    a = a + 1
                    if guest != 'VectorBob':
                        print(txt)
                        print(guest)
                        if guest in bl:
                            send_txt('你该洗洗睡了{}'.format(guest), 1)
                            send_txt('bist du blind order taub! Schwachkopf:) {}'.format(guest), 1)

                        if ((txt.find('抱') != -1) or (txt.find('嘴') != -1) or (txt.find('亲') != -1) or ()):
                            send_txt('keep distance for safety{}{}'.format(verbot,guest), 1)
                        else:
                            pass

                        if txt.find('老婆') != -1:
                            send_txt('halts maul! {}'.format(guest),1)


                        if ('送了' in txt) and ('云贝' not in txt):
                            gift = txt.replace("了", '的')
                            send_txt('❤蟹蟹@{}{}'.format(guest, gift),1)
                            # screen_shot(path,txt)

                        # if '关注了主播' in txt:
                        #     send_txt('☑蟹蟹关注！@{}'.format(guest), 1)

                        if '加入了' in txt:
                            send_txt('❀我还以为下次一定呢！@{}'.format(guest), 1)

                        if '粉团升' in txt:
                            send_txt('{}你又进步了！@{}'.format('⇧', guest), 1)

                        if ('爱会消失' in txt) or ('爱消失' in txt):
                            send_txt('nothing last forever cutey {} '.format(guest), 1)

                        if '分享了直播间' in txt:
                            send_txt('Good job ☝☝☝ cutey {} '.format(guest), 1)

                        if (str(txt) == '1') and (guest == owner):
                                # "*******欢迎新来的小耳朵们********" + 
                                # "**********主播正在唱歌***********" +
                                # "**************请稍等***************"
                            send_txt(
                                # 23
                                "*             欢迎新来的小耳朵们           *" + 
                                "*                  主播正在唱歌                  *" +
                                "*                        请稍等                        *" ,1)

                        if (txt == '@{}'.format('VectorBob')) and (guest not in [owner, 'vectortools']):
                            txt_l = [
                                "Hello",
                                "problem?",
                                "What up y'all!"
                            ]
                            random_id = random.randint(0, len(txt_l) - 1)
                            try:
                                int(txt.split(' ')[1])
                            except:
                                send_txt(txt_l[random_id] + ' ' + guest, 1)

                        if txt.split(' ')[0] == '@VectorBob':
                            if guest in [owner, 'vectortools']:
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
                                if txt.split(' ')[1] == '星座':
                                    try:
                                        star_sign = txt.split(' ')[2]
                                        day = txt.split(' ')[3]
                                        all_info = horoscope_(sign = star_sign, day = day)
                                        basis = "日期:{} 星座:{} 范围:{}".format(all_info[0], all_info[1], all_info[2])
                                        advance = "兼容:{} 幸运时间:{} 幸运数字:{} 心情:{}".format(all_info[3], all_info[4],all_info[5], all_info[6])
                                        discreption = all_info[7]

                                        send_txt(basis,2)
                                        send_txt(advance,2)
                                        send_txt(discreption,2)
                                    except:
                                        send_txt("完了没找到 my master {}".format(guest),1)

                                if txt.split(' ')[1] == 'game' and isinstance(int(txt.split(' ')[2]), int):
                                        curr_max = int(txt.split(' ')[2])
                                        curr_min = 0
                                        num = int(random.randint(1,curr_max))
                                        send_txt('you have to guess the a number between 1 and {}'.format(curr_max),1)
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
                                                        print(num)
                                                        if (txt.split(' ')[1] == 'exit') and (guest in [owner, 'vectortools'] ):
                                                            send_txt("Exiting... {}".format(guest),1)
                                                            start = False

                                                        if isinstance(int(txt.split(' ')[1]), int):
                                                            guess_num = int(txt.split(' ')[1])

                                                            if guess_num < num:
                                                                curr_min = max(guess_num, curr_min)
                                                                curr_max = max(guess_num, curr_max) 
                                                                send_txt('Your guess is low, try ({},{}) {}'.format(curr_min,curr_max, guest),1)
                                                            if guess_num > num:
                                                                curr_min = min(guess_num, curr_min)
                                                                curr_max = min(guess_num, curr_max) 
                                                                send_txt('Your guess is high, try ({},{}) {}'.format(curr_min,curr_max, guest),1)
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


                                if txt.split(' ')[1] == 'wheel' and isinstance(int(txt.split(' ')[2]), int):
                                    number_of_players = int(txt.split(' ')[2])
                                    curr_min = 0
                                    send_txt('{} players'.format(number_of_players),1)
                                    players = []
                                    players_name = []
                                    guessed = []

                                    num_str = RandomNumGenerator()
                                    print(num_str)
                                    playerIndex = 0
                                    winner = False
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
                                                    print(players_name)
                                                    if len(players_name)<number_of_players:
                                                        if (txt.split(' ')[0] == '@{}'.format('VectorBob')) and (guest not in players_name):
                                                                players_name.append(guest)
                                                    else:
                                                        print('continue')
                                                        if len(players) == 0:
                                                            players = [WOFHumanPlayer(player) for player in players_name]
                                                            send_txt("Guess a number 0-9 or type pass: ",1)
                                                            send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                            player = players[playerIndex]
                                                        if txt.split(' ')[0] == '@{}'.format('VectorBob') and txt.split(' ')[1].lower() == 'pass' and (guest == player.name):
                                                            send_txt('{} 弃权'.format(player.name),1)
                                                            playerIndex = (playerIndex + 1) % len(players)
                                                            player = players[playerIndex]
                                                            send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                            pass
                                                        if txt.split(' ')[0] == '@{}'.format('VectorBob') and txt.split(' ')[1] == 'exit' and (guest in [owner, 'vectortools'] ):
                                                            send_txt('Exiting...',1)
                                                            break

                                                        if txt.split(' ')[0] == '@{}'.format('VectorBob') and isinstance(int(txt.split(' ')[1]), int) and (guest == player.name):
                                                            get_move = txt.split(' ')[1]
                                                            print(get_move)
                                                            wheelPrize = spinWheel(8,1,1)
                                                            # send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                            time.sleep(1)
                                                            if get_move == 'pass':
                                                                send_txt('{} 弃权'.format(player.name),1)
                                                                playerIndex = (playerIndex + 1) % len(players)
                                                                player = players[playerIndex]
                                                                send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                                pass
                                                            else:
                                                                send_txt('{} spins->{}'.format(player.name, wheelPrize),1)
                                                                if wheelPrize == '破产':
                                                                    player.goBankrupt()
                                                                    playerIndex = (playerIndex + 1) % len(players)
                                                                    player = players[playerIndex]
                                                                    send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                                elif wheelPrize == '轮空':
                                                                    playerIndex = (playerIndex + 1) % len(players)
                                                                    player = players[playerIndex]
                                                                    send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                                    pass
                                                                else:
                                                                    # send_txt('{} guesses "{}"'.format(player.name, get_move),1)
                                                                    if get_move not in guessed:
                                                                        guessed.append(get_move)
                                                                        count = num_str.count(get_move) # returns an integer with how many times this letter appears
                                                                        print(count)
                                                                        if count > 0:
                                                                            cash = cash_class(numbercount(num_str), get_move)
                                                                            if count == 1:
                                                                                player.addMoney(count * cash)
                                                                                send_txt("one {} {} has ${}".format(get_move, player.name, player.prizeMoney),1)
                                                                                send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                                            else:
                                                                                player.addMoney(count * cash)
                                                                                send_txt("There r {} {} {} has ${}".format(count, get_move, player.name, player.prizeMoney),1)
                                                                                send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                         
                                    #                                         # Give them the money and the prizes
                                                                            # player.addMoney(count * cash)
                                                                            # send_txt('{} has ${}'.format(player.name, player.prizeMoney),1)
                                                                            # send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                    #                                         # all of the letters have been guessed
                                                                            if obscurePhrase(num_str, guessed) == num_str:
                                                                                result = sorted([(player.name, player.prizeMoney) for player in players], key=lambda tup: tup[1])
                                                                                if len(players) == 1:
                                                                                    send_txt('{} wins! ${}'.format(result[0][0], result[0][1]),1)
                                                                                    send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                                                else:
                                                                                    send_txt('{} wins! ${}'.format(result[-1][0], result[-1][1]),1)
                                                                                    send_txt('loser:{} ${}'.format(result[0][0],result[0][1]),1)
                                                                                    send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                                                a = j+1
                                                                                start = False                  
                                                                        else: 
                                                                            send_txt("no {} {}".format(get_move, player.name),1)
                                                                        
                                                                        playerIndex = (playerIndex + 1) % len(players)
                                                                        player = players[playerIndex]
                                                                        # send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                                    else:
                                                                        send_txt("{} already guessed try again".format(get_move),1)
                                                                        send_txt(showBoard(obscurePhrase(num_str, guessed), guessed),1)
                                                except:
                                                    pass
                                        except:
                                            pass   

                                if txt.split(' ')[1] not in ['chat','gh','love','天气','reset','game','星座']:
                                    try:
                                        int(txt.split(' ')[1])
                                    except:
                                        inp = ' '.join(txt.split(' ')[1:])
                                        print(inp + 'this is inout')
                                        send_txt('{} my master {}'.format(auto_chat(inp), guest), 1)
                            else:
                                if txt.split(' ')[1] != '天气':
                                    try:
                                        int(txt.split(' ')[1])
                                    except:
                                        # send_txt('Hello, my cutey {}'.format(guest), 1)
                                        # send_txt("im currently at work, please dont bother me!", 1)
                                        inp = ' '.join(txt.split(' ')[1:])
                                        print(inp + 'this is inout')
                                        send_txt('{} {}'.format(auto_chat(inp), guest), 1)
                                else:
                                    city = ' '.join(txt.split(' ')[2:])
                                    send_txt(get_weather(city), 1)

                        if ("晚安" in txt) and (guest != 'VectorBob'):
                            send_txt('Good Night ☽ !', 1)
                        if ("good night" in txt) and (guest != 'VectorBob'):
                            send_txt('Good Night ☽ !', 1)
                        if ("Good night" in txt) and (guest != 'VectorBob'):
                            send_txt('Good Night ☽ !', 1)

                        # if (txt == '进入了直播间') and (guest not in bl) and (guest != owner):
                        #     txt_l = [
                        #         'Bob以为你再也不会来了@{}！'.format(guest),
                        #         '欢迎@{} 进入直播间！'.format(guest),
                        #         '等你好久了@{}, 怎么才来！'.format(guest)
                        #     ]
                        #     random_id = random.randint(0, len(txt_l) - 1)
                        #     send_txt('☺'+ txt_l[random_id], 1)
                        if (txt == '进入了直播间') and (guest == owner):
                            send_txt('look小一发儿你来了 @{}'.format(owner), 1)

                        if (txt.split(' ')[0] == '@VectorBob') and (guest in [owner]):
                            txt_l = [
                                "anyway Bob will stand behind you! ",
                                "anyone can betray u except Bob!*mic drop!* ",
                                "always ready to serve my master! ",
                                'finally you text me! '
                            ]
                            random_id = random.randint(0, len(txt_l) - 1)
                            try:
                                int(txt.split(' ')[1])
                            except:
                                send_txt(txt_l[random_id] + guest, 1)

                        if (txt.split(' ')[0] == '@VectorBob') and (txt.split(' ')[1] == 'chat') and (guest in [owner, 'VectorBob']):
                            for i in range(chat):
                                print(i)
                                if i == (chat - 1):
                                    time.sleep(1)
                                    send_txt("overheating!!! Let's take a break!", 0)
                                else:
                                    time.sleep(1)
                                    txt_l = [
                                        'what can i say...',
                                        'Vector sucks!',
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
                                        'keep seafty!',
                                        'you are so mean to me！',
                                        "lieb' dich Lao Ma",
                                        "Eyyo, what's going on!",
                                        'i got it! f**k outta here!'
                                    ]
                                    random_id = random.randint(0, len(txt_l) - 1)
                                    send_txt(txt_l[random_id], 0)
                                    print(txt_l[random_id])
                        if txt == '进入了直播间':
                            pass
                        else:
                            if (TextBlob(txt).detect_language() == 'ko') or (TextBlob(txt).detect_language() == 'de'):
                                send_txt(translator.translate(txt).text,1)
                            else:
                                pass


                    else:
                        print('Bob')
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
        time.sleep(10)
    print(a)
