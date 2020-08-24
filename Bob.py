from selenium import webdriver
import webbrowser
import time
import random
import requests 
from bs4 import BeautifulSoup as bs
import pandas as pd
import re

chrome_path = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe %s'
web_path = 'https://look.163.com/live?id=270803279'
sleep_time = 60
txts = ['Hello! Guten Tag!','i am Robot Bob', 'luue is my brother','i will say a word every {}s!'.format(sleep_time)]
# txts = ['Hello! Guten Tag!','luue 把我拽过来了', '别理我我不配']


driver = webdriver.Chrome()
driver.get(web_path)
time.sleep(2)

driver.find_element_by_xpath("//*[@id='ssr-app']/div/div[1]/div[3]").click()
username = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[1]/div/div/div[2]/div/input")
username.send_keys("18615102720")
password = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[2]/div/div/input")
password.send_keys("ironman691101")
checkbox = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/p/label/span").click()
Login_Button = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[4]/a").click()
time.sleep(7)

for txt in txts:
    print(txt)
    text = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[1]/input")
    text.send_keys(txt)
    send = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[2]").click()
    time.sleep(1)
    text.clear()

while True:
    time.sleep(sleep_time)
    text = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[1]/input")
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
            'hold on hold on !!!',
            'Guess what!',
            'as you wish!',
            'Gesundheit!',
            'you are so mean to me！',
            "lieb' dich Lao Ma"
            ]
    random_id = random.randint(0,len(txt_l)-1)
    text.send_keys(txt_l[random_id])
    send = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[2]").click()
    text.clear()
    print(txt_l[random_id])


# abbo = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[1]/div[1]/div[3]/a").click()
# time.sleep(1)
# try:
#     gift = driver.find_element_by_xpath("//*[@id='panel-root']/div[1]/div[2]/div/div[10]/img[@src='p1.music.126.net/19VRwDL0dHUyonIdF788Tg==/109951165257821777.jpg?imageView=1&type=webp&thumbnail=120x0']").click()
# except:
#     text = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[1]/input")
#     text.send_keys('害!没修好')
#     send = driver.find_element_by_xpath("//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[2]/div[2]").click()

