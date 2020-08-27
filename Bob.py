from selenium import webdriver
import webbrowser
import time
import random
import requests 
from bs4 import BeautifulSoup as bs
import pandas as pd
import re

chrome_path = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
web_path = 'https://look.163.com/live?id=316155009'
# https://look.163.com/live?id=316155009
# https://look.163.com/live?id=73355245
# https://look.163.com/live?id=52446485
# https://look.163.com/live?id=241142287&position=110
sleep_time = 10
chat = 30

def send_txt (content,s_time):
    text = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[1]/input")
    text.send_keys(content)
    send = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[2]").click()
    time.sleep(s_time)


driver = webdriver.Chrome()
driver.get(web_path)
time.sleep(7)

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
User_Manual = ["Hello i am Genie of the Lamp"] 
for txt in User_Manual:
    print(txt)
    send_txt(txt,1)

txt = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[1]").text
print(txt)
i = 0
content =['first']
owner = driver.find_element_by_class_name('nickname_3pHT9').text
print(owner.split(':'))
while True:
    time.sleep(1)
    print('.........')

    try:
        txt = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]".format(i)).text

        if content[-1] != txt:
            content.append(txt)
            print(txt)
        else:
            try:
                gast = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[2]".format(a+1)).text.split(':')[0]
                txt = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]".format(a+1)).text
                a = a+1
                print(txt)
                print(gast)

                if '送了' in txt:
                    gift = txt.replace("了",'的')
                    send_txt('蟹蟹{}{}'.format(gast,gift),1)

                if (txt.split(' ')[0] == '@Genie_Lamp'):
                    if gast in [owner,'luue']:
                        if txt.split(' ')[1] == 'chat':
                            send_txt('as you wish, my master {}'.format(gast),1)
                        else:
                            send_txt('Hello, my master {}'.format(gast),1)
                    else:
                        if txt.split(' ')[1] != 'chat': 
                            send_txt('Hello, my little cutey {}'.format(gast),1)
                            txt_l = [
                                "i am currently at work, please dont bother me!",
                            ]
                            random_id = random.randint(0,len(txt_l)-1)
                            send_txt(txt_l[random_id],1)

                        # else:
                        #     txt_l = [
                        #     "dont bother me again! ",
                        #     "dont touch me again! ",
                        #     "get off here! "
                        #     "you arent my boss! Dont @me again！"
                        #     ]
                        #     random_id = random.randint(0,len(txt_l)-1)
                        #     send_txt(txt_l[random_id]+gast,1)
                
                # if (txt.split(' ')[0] == '@Genie_Lamp') and (txt.split(' ')[1] not in ['hello','Hello','hi','Hi','你好','babe']) and (gast not in [owner,'luue']):
                #     txt_l = [
                #             "dont bother me again! ",
                #             "dont touch me again! ",
                #             "get off here! "
                #             "you arent my boss! Dont @me again！"
                #             ]
                #     random_id = random.randint(0,len(txt_l)-1)
                #     send_txt(txt_l[random_id]+gast,1)

                if ("晚安" in txt) and (gast != 'Genie_Lamp'):
                    send_txt('Good Night!',1)

                if (txt == '进入了直播间') and (gast !='Genie_Lamp'):
                    txt_l = [
                            'Genie以为你再也不会来了{}！'.format(gast),
                            '欢迎{}进入了直播间！'.format(gast),
                            '等你好久了{}, 怎么才来！'.format(gast)
                            ]
                    random_id = random.randint(0,len(txt_l)-1)
                    send_txt(txt_l[random_id],1)

                if (txt.split(' ')[0] == '@Genie_Lamp') and (gast in [owner]):
                    txt_l = [
                        "anyway Genie will stand behind you! ",
                        "anyone can betray u except Genie!(mic drop!) ",
                        "as you wish! my Boss! ",
                        'finally you text me! '
                        ]
                    random_id = random.randint(0,len(txt_l)-1)
                    send_txt(txt_l[random_id]+gast,1)

                if (txt.split(' ')[0] == '@Genie_Lamp') and (txt.split(' ')[1] == 'chat') and (gast in [owner, 'luue']):
                    for i in range(chat):
                        print(i)
                        if i == (chat-1):
                            time.sleep(1)
                            send_txt("overheating!!! Let's take a break!",0)
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
                            random_id = random.randint(0,len(txt_l)-1)
                            send_txt(txt_l[random_id],0)
                            print(txt_l[random_id])

            except:
                print('no new thing')
        #     pass
    except:
        i +=1
        a = i  

























# login
# driver.find_element_by_xpath("//*[@id='ssr-app']/div/div[1]/div[3]").click()
# username = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[1]/div/div/div[2]/div/input")
# username.send_keys("18615102720")
# password = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[2]/div/div/input")
# password.send_keys("ironman691101")
# checkbox = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/p/label/span").click()
# Login_Button = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[4]/a").click()
# time.sleep(7)



















# User Manual
# User_Manual = ['hello! i am Robot Alita', 'please see below for details',"input: '@Genie_Lamp chat' for random chat", "input: '@Genie_Lamp deng' for daily english",'otherwise i have some hidden skills'] 
# User_Manual = ["you're so nice！"] 
# for txt in User_Manual:
#     print(txt)
#     send_txt(txt,1)

# # abbo = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[1]/div[1]/div[3]/a").click()
# # Daily English
# r = requests.get('https://www.hjenglish.com/new/tag/%E6%AF%8F%E6%97%A5%E4%B8%80%E5%8F%A5/')
# webpage = bs(r.content,features="lxml")
# de = webpage.find('p', attrs = {'class': 'article-content'}).get_text().split(' ')
# de = ' '.join(de[1:])
# daily_eng = []
# if len(de)>50:
#     daily_eng.append(de[:50])
#     daily_eng.append(de[50:])
# else:
#     daily_eng.append(de)
# print(daily_eng)

# owner = driver.find_element_by_class_name('nickname_3pHT9').text
# print(owner.split(':'))
# customer_l = []
# while True:
#     driver.refresh()
#     time.sleep(6)
#     try:
#         content = driver.find_element_by_class_name('text_290DO').text
#         customer = driver.find_element_by_class_name('nick_20QEy').text.split(':')[0]
#         print(customer)
#         print(content)
#         if customer !='Genie_Lamp':

#             if (customer not in customer_l) and (customer != owner) :
#                 customer_l.append(customer)
#                 txt_l = [
#                         'Alita以为你再也不会来了{}！'.format(customer),
#                         '你现在讲话还不算晚{}！'.format(customer),
#                         '等你好久了{}, 怎么才来！'.format(customer)
#                         ]
#                 random_id = random.randint(0,len(txt_l)-1)
#                 send_txt(txt_l[random_id],1)

#             if "晚安" in content:
#                 send_txt('Good Night!',1)

#             if content == '@Genie_Lamp deng':
#                 for txt in daily_eng:
#                     print(txt)
#                     send_txt(txt,1)

#             if content == '@Genie_Lamp chat':
#                 for i in range(chat):
#                     print(i)
#                     if i == (chat-1):
#                         time.sleep(sleep_time)
#                         send_txt("overheating!!! Let's take a break!",0)
#                     else:
#                         time.sleep(sleep_time)
#                         txt_l = [
#                                 'what can i say...',
#                                 'Lao De sucks!',
#                                 'wasup!wasup!',
#                                 'no drugs! no porns! no gambling!',
#                                 "That's b*llsh*t!",
#                                 'look at that, what a poor guy!',
#                                 'everybody lights up!',
#                                 "love u! let's corona party!",
#                                 'Excuse me!',
#                                 "nobody's fault but mine",
#                                 'hold on hold on!!!',
#                                 'Guess what!',
#                                 'as you wish!',
#                                 'Gesundheit!',
#                                 'you are so mean to me！',
#                                 "lieb' dich Lao Ma",
#                                 "Eyyo, what's going on Digga!",
#                                 'i got it! f**k outta here!'
#                                 ]
#                         random_id = random.randint(0,len(txt_l)-1)
#                         send_txt(txt_l[random_id],0)
#                         print(txt_l[random_id])
#             if (content.split(' ')[0] == '@Genie_Lamp') and (content.split(' ')[1] not in ['deng','chat']) and (customer != owner) and ("晚安" not in content):
#                 txt_l = [
#                         "dont bother me again! ",
#                         "dont touch me again! ",
#                         "get off here! "
#                         "you arent my boss! Dont @me again！"
#                         ]
#                 random_id = random.randint(0,len(txt_l)-1)
#                 send_txt(txt_l[random_id]+customer,1)
#                 print(txt_l[random_id]+customer)
#             if (content.split(' ')[0] == '@Genie_Lamp' or content == '@Genie_Lamp') and (customer == owner):
#                 txt_l = [
#                         "anyway Alita will stand behind you! ",
#                         "anyone can betray u except Alita!(mic drop!) ",
#                         "as you wish! my Boss!",
#                         'finally you text me!'
#                         ]
#                 random_id = random.randint(0,len(txt_l)-1)
#                 send_txt(txt_l[random_id]+owner,1)
#                 print(txt_l[random_id]+owner)         
#     except:
#         print('none')








