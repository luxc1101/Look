from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
import webbrowser
import time
import random
import requests 
from bs4 import BeautifulSoup as bs
import pandas as pd
import re


chrome_path = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe %s'
web_path = 'https://look.163.com/live?id=316155009'

driver = webdriver.Chrome()
driver.get(web_path)
time.sleep(7)


# login
# driver.find_element_by_xpath("//*[@id='ssr-app']/div/div[1]/div[3]").click()
# username = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[1]/div/div/div[2]/div/input")
# username.send_keys("18615102720")
# password = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[2]/div/div/input")
# password.send_keys("ironman691101")
# checkbox = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/p/label/span").click()
# Login_Button = driver.find_element_by_xpath("//*[@id='j-portal']/div/div/div[2]/div/div[1]/div/div[4]/a").click()
# time.sleep(7)

element_present = driver.find_element_by_class_name('text_290DO').text
print(element_present)
myElem = WebDriverWait(driver, 10).until(element_present)