# -*- coding: utf-8 -*-

# Form implementation generated from reading ui file 'Qt_Bot.ui'
#
# Created by: PyQt5 UI code generator 5.15.4
#
# WARNING: Any manual changes made to this file will be lost when pyuic5 is
# run again.  Do not edit this file unless you know what you are doing.


from PyQt5 import QtCore, QtGui, QtWidgets
from PyQt5 import QtGui, QtCore
from PyQt5.QtWidgets import QMainWindow
from PyQt5.QtWidgets import QMessageBox
from PyQt5.QtCore import QThread, pyqtSignal
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import webbrowser
import time
import random
import re
import os
from subprocess import call
import shutil
import json
import sys
sys.setrecursionlimit(100000000)
# from bs4 import BeautifulSoup as bs
# import requests
# import emojis
# import nltk
# nltk.download()
# from nltk.stem.lancaster import LancasterStemmer
# stemmer = LancasterStemmer()
# import numpy as np
# import pickle
# from googletrans import Translator
# from textblob import TextBlob
# import pyaztro
# import datetime

class Bob_Form(QMainWindow):
    idx = 2
    def setupUi(self, Form):
        Form.setObjectName("Form")
        Form.resize(480, 650)
        self.gridLayout_2 = QtWidgets.QGridLayout(Form)
        self.gridLayout_2.setObjectName("gridLayout_2")
        self.groupBox = QtWidgets.QGroupBox(Form)
        self.groupBox.setFlat(False)
        self.groupBox.setObjectName("groupBox")
        self.verticalLayout_5 = QtWidgets.QVBoxLayout(self.groupBox)
        self.verticalLayout_5.setObjectName("verticalLayout_5")
        self.gridLayout = QtWidgets.QGridLayout()
        self.gridLayout.setObjectName("gridLayout")
        self.comboBox_login = QtWidgets.QComboBox(self.groupBox)
        self.comboBox_login.setObjectName("comboBox_login")
        self.comboBox_login.addItem("")
        self.comboBox_login.addItem("")
        self.gridLayout.addWidget(self.comboBox_login, 2, 1, 1, 1)
        self.label_Login = QtWidgets.QLabel(self.groupBox)
        self.label_Login.setObjectName("label_Login")
        self.gridLayout.addWidget(self.label_Login, 2, 0, 1, 1)
        self.label_livelink = QtWidgets.QLabel(self.groupBox)
        self.label_livelink.setObjectName("label_livelink")
        self.gridLayout.addWidget(self.label_livelink, 0, 0, 1, 1)
        self.label_3 = QtWidgets.QLabel(self.groupBox)
        self.label_3.setObjectName("label_3")
        self.gridLayout.addWidget(self.label_3, 1, 0, 1, 1)
        self.LinEdit_livelink = QtWidgets.QLineEdit(self.groupBox)
        self.LinEdit_livelink.setObjectName("LinEdit_livelink")
        self.gridLayout.addWidget(self.LinEdit_livelink, 0, 1, 1, 1)
        self.verticalLayout_2 = QtWidgets.QVBoxLayout()
        self.verticalLayout_2.setObjectName("verticalLayout_2")
        self.horizontalLayout_2 = QtWidgets.QHBoxLayout()
        self.horizontalLayout_2.setObjectName("horizontalLayout_2")
        self.label_SleepWechat = QtWidgets.QLabel(self.groupBox)
        self.label_SleepWechat.setObjectName("label_SleepWechat")
        self.horizontalLayout_2.addWidget(self.label_SleepWechat)
        self.spinBox_ = QtWidgets.QSpinBox(self.groupBox)
        self.spinBox_.setMinimum(20)
        self.spinBox_.setObjectName("spinBox_")
        self.horizontalLayout_2.addWidget(self.spinBox_)
        self.verticalLayout_2.addLayout(self.horizontalLayout_2)
        self.gridLayout.addLayout(self.verticalLayout_2, 4, 1, 1, 1)
        self.horizontalLayout_6 = QtWidgets.QHBoxLayout()
        self.horizontalLayout_6.setObjectName("horizontalLayout_6")
        self.lineEdit_UserName = QtWidgets.QLineEdit(self.groupBox)
        self.lineEdit_UserName.setObjectName("lineEdit_UserName")
        self.horizontalLayout_6.addWidget(self.lineEdit_UserName)
        self.lineEdit_Key = QtWidgets.QLineEdit(self.groupBox)
        self.lineEdit_Key.setObjectName("lineEdit_Key")
        self.horizontalLayout_6.addWidget(self.lineEdit_Key)
        self.gridLayout.addLayout(self.horizontalLayout_6, 3, 1, 1, 1)
        self.lineEdit_ChromePath = QtWidgets.QLineEdit(self.groupBox)
        self.lineEdit_ChromePath.setObjectName("lineEdit_ChromePath")
        self.gridLayout.addWidget(self.lineEdit_ChromePath, 1, 1, 1, 1)
        self.lineEdit_Welcome = QtWidgets.QLineEdit(self.groupBox)
        self.lineEdit_Welcome.setObjectName("lineEdit_Welcome")
        self.gridLayout.addWidget(self.lineEdit_Welcome, 5, 1, 1, 1)
        self.checkBox_OnlyFans = QtWidgets.QCheckBox(self.groupBox)
        self.checkBox_OnlyFans.setObjectName("checkBox_OnlyFans")
        self.gridLayout.addWidget(self.checkBox_OnlyFans, 5, 0, 1, 1)
        self.verticalLayout_5.addLayout(self.gridLayout)
        self.pushButton_OpenChrome = QtWidgets.QPushButton(self.groupBox)
        font = QtGui.QFont()
        font.setPointSize(12)
        font.setBold(True)
        self.pushButton_OpenChrome.setFont(font)
        self.pushButton_OpenChrome.setObjectName("pushButton_OpenChrome")
        self.verticalLayout_5.addWidget(self.pushButton_OpenChrome)
        self.pushButton_login = QtWidgets.QPushButton(self.groupBox)
        font = QtGui.QFont()
        font.setPointSize(12)
        font.setBold(True)
        self.pushButton_login.setFont(font)
        self.pushButton_login.setObjectName("pushButton_login")
        self.verticalLayout_5.addWidget(self.pushButton_login)
        self.horizontalLayout = QtWidgets.QHBoxLayout()
        self.horizontalLayout.setObjectName("horizontalLayout")
        self.pushButton_Start_bot = QtWidgets.QPushButton(self.groupBox)
        font = QtGui.QFont()
        font.setPointSize(12)
        font.setBold(True)
        self.pushButton_Start_bot.setFont(font)
        self.pushButton_Start_bot.setObjectName("pushButton_Start_bot")
        self.horizontalLayout.addWidget(self.pushButton_Start_bot)
        self.pushButton_Stop_bot = QtWidgets.QPushButton(self.groupBox)
        font = QtGui.QFont()
        font.setPointSize(12)
        font.setBold(True)
        self.pushButton_Stop_bot.setFont(font)
        self.pushButton_Stop_bot.setObjectName("pushButton_Stop_bot")
        self.horizontalLayout.addWidget(self.pushButton_Stop_bot)
        self.pushButton_DriverRefresh = QtWidgets.QPushButton(self.groupBox)
        font = QtGui.QFont()
        font.setPointSize(12)
        font.setBold(True)
        self.pushButton_DriverRefresh.setFont(font)
        self.pushButton_DriverRefresh.setObjectName("pushButton_DriverRefresh")
        self.horizontalLayout.addWidget(self.pushButton_DriverRefresh)
        self.verticalLayout_5.addLayout(self.horizontalLayout)
        self.gridLayout_2.addWidget(self.groupBox, 0, 1, 1, 1)
        self.groupBox_2 = QtWidgets.QGroupBox(Form)
        self.groupBox_2.setObjectName("groupBox_2")
        self.verticalLayout_6 = QtWidgets.QVBoxLayout(self.groupBox_2)
        self.verticalLayout_6.setObjectName("verticalLayout_6")
        self.textEdit_TraceWin = QtWidgets.QTextEdit(self.groupBox_2)
        self.textEdit_TraceWin.setObjectName("textEdit_TraceWin")
        self.verticalLayout_6.addWidget(self.textEdit_TraceWin)
        self.horizontalLayout_5 = QtWidgets.QHBoxLayout()
        self.horizontalLayout_5.setObjectName("horizontalLayout_5")
        self.lineEdit_Chat = QtWidgets.QLineEdit(self.groupBox_2)
        self.lineEdit_Chat.setObjectName("lineEdit_Chat")
        self.horizontalLayout_5.addWidget(self.lineEdit_Chat)
        self.pushButton_Send = QtWidgets.QPushButton(self.groupBox_2)
        font = QtGui.QFont()
        font.setPointSize(12)
        font.setBold(True)
        self.pushButton_Send.setFont(font)
        self.pushButton_Send.setObjectName("pushButton_Send")
        self.horizontalLayout_5.addWidget(self.pushButton_Send)
        self.verticalLayout_6.addLayout(self.horizontalLayout_5)
        self.gridLayout_2.addWidget(self.groupBox_2, 1, 1, 1, 1)
        self.groupBox.setStyleSheet('QGroupBox:title {'
                 'subcontrol-origin: margin;'
                 'subcontrol-position: top center;'
                 'border-top-left-radius: 15px;'
                 'border-top-right-radius: 15px;'
                 'padding: 5px 300px;'
                 'background-color: #FF17365D;'
                 'color: rgb(255, 255, 000); }')
        self.groupBox_2.setStyleSheet('QGroupBox:title {'
                 'subcontrol-origin: margin;'
                 'subcontrol-position: top center;'
                 'border-top-left-radius: 15px;'
                 'border-top-right-radius: 15px;'
                 'padding: 5px 300px;'
                 'background-color: #FF17365D;'
                 'color: rgb(255, 255, 000); }')
        self.checkBox_OnlyFans.setChecked(False)

        with open(os.path.join(os.getcwd(),'setup.json'),'r',encoding="utf8") as f:
            self.setup_dict = json.load(f)

        
        self.retranslateUi(Form)
        QtCore.QMetaObject.connectSlotsByName(Form)
        self.thread = {}
        self.widget_counter_int = 0
        self.pushButton_OpenChrome.clicked.connect(self.chrome_cmd_window)
        self.pushButton_login.clicked.connect(lambda: self.login(self.lineEdit_UserName.text(), self.lineEdit_Key.text()))
        self.pushButton_Start_bot.clicked.connect(self.start_receiving_message)
        self.pushButton_Stop_bot.clicked.connect(self.stop_receiving_message)
        self.pushButton_DriverRefresh.clicked.connect(self.refresh)
        self.pushButton_Send.clicked.connect(lambda: self.manual_txt_send(self.lineEdit_Chat.text(), 1))

    def retranslateUi(self, Form):
        _translate = QtCore.QCoreApplication.translate
        Form.setWindowTitle(_translate("Form", "Form"))
        self.groupBox.setTitle(_translate("Form", "Setup"))
        self.comboBox_login.setItemText(0, _translate("Form", "Phone"))
        self.comboBox_login.setItemText(1, _translate("Form", "Wechat"))
        self.label_Login.setText(_translate("Form", "Login"))
        self.label_livelink.setText(_translate("Form", "Live Links"))
        self.label_3.setText(_translate("Form", "Chrome Path"))
        self.label_SleepWechat.setText(_translate("Form", "Sleep time with Wechat login"))
        self.lineEdit_UserName.setPlaceholderText(_translate("Form", "User Name (Phone Nr.)"))
        self.lineEdit_UserName.setText(_translate("Form", self.setup_dict['User Name']))
        self.lineEdit_Key.setPlaceholderText(_translate("Form", "Key"))
        self.lineEdit_Key.setText(_translate("Form", self.setup_dict['Key']))
        self.lineEdit_ChromePath.setText(_translate("Form", self.setup_dict['Chrome Path']))
        self.lineEdit_Welcome.setText(_translate("Form", self.setup_dict['Welcome']))
        self.pushButton_OpenChrome.setText(_translate("Form", "Open Chrome"))
        self.pushButton_login.setText(_translate("Form", "Login"))
        self.pushButton_Start_bot.setText(_translate("Form", "Start Bot"))
        self.pushButton_Stop_bot.setText(_translate("Form", "Stop Bot"))
        self.pushButton_DriverRefresh.setText(_translate("Form", "Refresh"))
        self.groupBox_2.setTitle(_translate("Form", "Trace Window"))
        self.lineEdit_Chat.setPlaceholderText(_translate("Form", "chat with streamer..."))
        self.pushButton_Send.setText(_translate("Form", "Send"))
        self.checkBox_OnlyFans.setText(_translate("Form", "OnlyFans"))
        self.LinEdit_livelink.setText(_translate("Form", self.setup_dict['Live Links']))
        # self.LinEdit_livelink.setText(_translate("Form", "https://look.163.com/live?id=346672597"))
        # self.lineEdit_Key.setText(_translate("Form", "ironman691101"))
        # self.lineEdit_UserName.setText(_translate("Form", "18615102720"))

    #############################################
    #
    #   open chrome webdriver
    #
    #############################################
    def chrome_cmd_window(self):
        # ceate a dir in the same root path if it is not exit.
        try:
            dirpath = os.path.join(os.getcwd(), 'Chromeprofile')
            os.makedirs(dirpath)
        except FileExistsError:
            shutil.rmtree(dirpath)
            os.makedirs(dirpath)
        chromeAn_path = self.lineEdit_ChromePath.text()
        # If you want to execute more than one cmd command in a row, you should add && between the two commands.
        cmdline = 'cd {} && start chrome.exe --remote-debugging-port=8888 --user-data-dir="{}" && exit'.format(os.path.normpath(chromeAn_path), dirpath)
        rc = call("start cmd /K " + cmdline, shell=True)
        web_path = self.LinEdit_livelink.text()
        # setup chrome webdriver and Open the web page and link to the URL
        file_exists = os.path.exists('chromedriver.exe')
        if file_exists:
            try:
                opt = Options()
                opt.add_experimental_option("debuggerAddress","localhost:8888",)
                self.driver = webdriver.Chrome(chrome_options=opt)
                self.driver.get(web_path)
                time.sleep(3)
                self.pushButton_login.setEnabled(True)
                self.owner = self.driver.find_element(By.XPATH,'//*[@id="CONTENT_ID"]/div/div[1]/div[1]/div[2]/div[1]/div[1]').text
                self.bot = self.setup_dict['Bot Name']
                self.fans = self.setup_dict['Fans Name']
            except:
                QMessageBox.critical(self,'Error', 'Failed to open webdriver, please check chrome webdriver version') 
        else:
            QMessageBox.critical(self,'Error', "file is not found, please download <a href=\"https://chromedriver.chromium.org/downloads\">chromedriver</a> and put in the same folder")

    #############################################
    #
    #   accout login with phone or wechat
    #
    #############################################
    def timer_start(self, count):
        self.time_left_int = count

        self.my_qtimer = QtCore.QTimer(self)
        self.my_qtimer.timeout.connect(self.timer_timeout)
        self.my_qtimer.start(1000)
        QMessageBox.information(self, 'Info','you have {}s to scann QR-Code'.format(count))

    def timer_timeout(self):
        self.time_left_int -= 1
        if self.time_left_int != 0:
            self.widget_counter_int = (self.widget_counter_int + 1)
            self.label_SleepWechat.setText('Timer: ' + str(self.widget_counter_int))
        else:
            self.my_qtimer.stop()
            self.widget_counter_int = 0
            QMessageBox.information(self, 'Info','time out')

    def login(self, PhoneNr, Key):
        loginway = self.comboBox_login.currentText()
        self.driver.find_element(By.XPATH,'//*[@id="easy-app"]/div/div[1]/div[3]').click()
        time.sleep(3)
        #auto_login_checkbox = self.driver.find_element(By.XPATH, '//*[@id="j-portal"]/div/div/div[2]/div/div[1]/div/div[3]/label/span/span').click()
        try:
            security_checkbox = self.driver.find_element(By.XPATH,'//*[@id="j-portal"]/div/div/div[2]/div/div[1]/div/p/label/span').click()
            if loginway == 'Phone':
                self.lineEdit_UserName.setEnabled(True)
                self.lineEdit_Key.setEnabled(True)
                try:
                    accout = self.driver.find_element(By.XPATH,'//*[@id="j-portal"]/div/div/div[2]/div/div[1]/div/div[1]/div/div/div[2]/div/input')
                    accout.send_keys(PhoneNr)
                    password = self.driver.find_element(By.XPATH,'//*[@id="j-portal"]/div/div/div[2]/div/div[1]/div/div[2]/div/div/input')
                    password.send_keys(Key)
                    login_click = self.driver.find_element(By.XPATH,'//*[@id="j-portal"]/div/div/div[2]/div/div[1]/div/div[4]/a').click()
                    time.sleep(2)
                    QMessageBox.information(self, 'Info','Login successful!')
                except:
                    QMessageBox.critical(self, 'Error', 'Failed to login, please check your accout and password')
            if loginway == 'Wechat':
                self.lineEdit_UserName.setEnabled(False)
                self.lineEdit_Key.setEnabled(False)
                try:
                    wechat_login = self.driver.find_element(By.XPATH, '//*[@id="j-portal"]/div/div/div[2]/div/div[2]/ul/li[1]/div').click()
                    self.timer_start(int(self.spinBox_.value()))
                except: 
                    QMessageBox.critical(self, 'Error', 'Failed to login')
        except:
            QMessageBox.information(self, 'Info','already logged in')
    #############################################
    #
    #   send message
    #
    #############################################
    def send_txt(self, content, s_time):
        if len(content) != 0: 
            # self.pushButton_Send.setEnabled(True)
            text = self.driver.find_element(By.XPATH, '//*[@id="CONTENT_ID"]/div/div[2]/div[2]/div/div/div[2]/div[1]/textarea')
            text.send_keys(content)
            # send = self.driver.find_element(By.XPATH, '//*[@id="CONTENT_ID"]/div/div[2]/div[2]/div/div/div[2]/div[2]').click()
            send = self.driver.find_element(By.XPATH, '//*[@id="CONTENT_ID"]/div/div[2]/div[2]/div/div/div[2]/div[2]/div').click()
            time.sleep(s_time)
            # self.pushButton_Send.setEnabled(False)
        # else:
            # self.pushButton_Send.setEnabled(False)
    def manual_txt_send(self, content, s_time):
        if len(content) != 0:
            self.send_txt(content, s_time)
            self.lineEdit_Chat.clear()    

    #############################################
    #
    #   receive message
    #
    #############################################
    def Update_rx_msg(self,msg):
        rx_msg = msg
        self.textEdit_TraceWin.append(rx_msg)

    def start_receiving_message(self):
        if len(self.lineEdit_Welcome.text())!=0:
            self.send_txt(self.lineEdit_Welcome.text(), 2)
        self.thread[1] = receive(parent = None, driver = self.driver, owner = self.owner, bot = self.bot, fansN = self.fans ,fansable = self.checkBox_OnlyFans.isChecked(), setupjs = self.setup_dict)
        self.thread[1].start()
        self.thread[1].rx_signal.connect(self.Update_rx_msg)
        self.pushButton_Stop_bot.setEnabled(True)
        self.pushButton_Start_bot.setEnabled(False)
        self.checkBox_OnlyFans.setEnabled(False)

    def stop_receiving_message(self):
        self.thread[1].stop()
        self.pushButton_Start_bot.setEnabled(True)
        self.pushButton_Stop_bot.setEnabled(False)
        self.checkBox_OnlyFans.setEnabled(True)
            
    def refresh(self):
        # self.send_txt('Restart in 10s', 2)
        self.thread[1].stop()
        receive.position = 2
        self.driver.refresh()
        time.sleep(10)
        self.pushButton_Start_bot.setEnabled(True)
        self.pushButton_Stop_bot.setEnabled(True)


#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#
# Class receive
#
#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
class receive(QThread):
    rx_signal = pyqtSignal(str)
    position = 2
    idx = 0
    def __init__(self, parent, driver, owner, bot, fansN, fansable, setupjs):
        super(receive, self).__init__(parent)
        self.is_running  = True
        # self.position = position
        self.driver = driver
        self.owner = owner
        # self.content = []
        self.content = {}
        self.rainbowcolor = {0:'#000000', 1: '#FF0000',2: '#FF7F00',3: '#ffcc00', 4: '#00FF00', 
                                5:'#33ccff',6:'#0000FF', 7:'#4B0082',8:'#9400D3', 9:'#ee82ee', }
        self.giftblicklist = ['粉团之心','云贝','糖果','魔法阵']
        self.bob = bot
        self.fansName = fansN
        self.fanscheck = fansable
        self.setup = setupjs
        self.txt_gift = [
                        '❤蟹蟹',
                        '❤Thank U',
                        '❤Danke Dir',
                        '❤Merci',
                        '❤Gracias'
                        ]

    def giftblock(self, giftblicklist, txt):
        for g in giftblicklist:
            if g in txt:
                return True
        return False  
    # def got_txt(self, position):
    #     try:
    #         # try:
    #         txtsys = self.driver.find_element(By.XPATH, "//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]".format(position)).text
    #         txtsys = re.split(' |\n',txtsys)
    #         guest = '~'
    #         try:
    #             guest = self.driver.find_element(By.XPATH, '//*[@id="CONTENT_ID"]/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[2]'.format(position)).text.split(':')[0]
    #         except:
    #             pass
    #         txtsys.insert(0,guest)
    #         # print(txtsys)        
    #         return ' '.join(txtsys)
    #         # except:
    #         #     pass
    #         # txt = self.driver.find_element(By.XPATH,'//*[@id="CONTENT_ID"]/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[3]'.format(position)).text
    #         # print('this is user txt: {}'.format(txt))
    #         # return txt
    #     except:
    #         return None
    # backtracking function
    def solve_recive_helper(self, content, position):
        max_idx = 1e8
        time.sleep(0.8)
        receive.position = position
        # Bob_Form.idx = self.position
        # print(receive.position)
        # print(Bob_Form.idx)  
        # txt = self.got_txt(position)
        receive.idx += 1
        #  print(receive.idx)
        if receive.idx >1500:
            self.driver.refresh()
            receive.idx = 0
            receive.position = 2
            time.sleep(10)
            self.content = {}
            Bob_Form.send_txt(self, self.setup['Welcome'],1)    
        try:
            txtsys = self.driver.find_element(By.XPATH,"//*[@id='CONTENT_ID']/div/div[2]/div[2]/div/div/div[1]/div[{}]".format(position)).text
            txtsys = re.split(' |\n',txtsys)
            guest = '~'
            try:
                guest = self.driver.find_element(By.XPATH, '//*[@id="CONTENT_ID"]/div/div[2]/div[2]/div/div/div[1]/div[{}]/span[2]'.format(position)).text.split(':')[0]
            except:
                pass
            txtsys.insert(0,guest)
            # print(txtsys)
            txt = ' '.join(txtsys)
                
        except:
            txt = None

        if position >= max_idx:
            return None
        if txt is None:
            return None
        else:
            if (position not in content) or (content[position] != txt):
                # content.append(position)
                content[position] = txt
                # print(self.fanscheck)   
                # print(self.fansName)
                try:
                    guest = txt.split(' ')[0]
                    if self.fanscheck == False:
                        if ('进入了直播间' in txt):
                            content.pop(position)
                    if self.fanscheck == True:
                        if ('进入了直播间' in txt) and (self.fansName in txt):
                            Bob_Form.send_txt(self, '欢迎 @{} 里面er请！'.format(guest), 1)
                        if ('进入了直播间' in txt) and (self.fansName not in txt):
                            content.pop(position)
                    if guest != self.bob:
                        ColorText = "<span style=\" font-size:8pt; font-weight:600; color:{};\" >".format(self.rainbowcolor[position%10])
                        ColorText += txt
                        ColorText += "</span>"
                    else:
                        ColorText = '<span style=\" text-decoration:underline; font-size:8pt; font-weight:600; color:{};\" >'.format(self.rainbowcolor[position%10])
                        ColorText += txt
                        ColorText += "</span>"
                    if '进入了直播间' not in txt:
                        self.rx_signal.emit(ColorText)
                    # Steamer are singing
                    if (txt.split(' ')[0] == self.owner) and (txt.split(' ')[-1] == '1'):
                        Bob_Form.send_txt(self,               
                            "*             欢迎新来的小耳朵们           *" + 
                            "*                  主播正在唱歌                  *" +
                            "*                        请稍等                        *" ,1)
                    if (txt.split(' ')[0] == self.owner) and (txt.split(' ')[-1] == '2'):
                        Bob_Form.send_txt(self, self.setup['2'],1)
                    # Thank you for donating gifts
                    if ('送了' in txt.split(' ')[-1]): 
                        if self.giftblock(self.giftblicklist, txt.split(' ')[-1]):
                            pass
                        else:
                            gift = txt.split(' ')[-1].replace("了", '的')
                            random_id = random.randint(0, len(self.txt_gift) - 1)
                            Bob_Form.send_txt(self,'{}@{} {}'.format(self.txt_gift[random_id], guest, gift),1)
                            # print('❤蟹蟹@{} {}'.format(guest, gift))
                    # upgrade
                    if '粉团升' in txt.split(' ')[-1]:
                        Bob_Form.send_txt(self, '{}你又进步了！@{}'.format('⇧', guest), 1)
                    # be member
                    if '加入了粉团' in txt.split(' ')[-1]:
                        Bob_Form.send_txt(self, '这就忍不住了，不是说下次一定吗！@{}'.format(guest), 1)
                    # owner come in
                    if (txt.split(' ')[-1] == '进入了直播间') and (txt.split(' ')[0] == self.owner):
                        Bob_Form.send_txt(self, 'look小一发儿你来了 @{}'.format(owner), 1)
                    # brush up the screen
                    if (txt.split(' ')[-1] == 'chat') and (guest in [self.owner, 'vectortools']):
                        for _ in range(20):
                            txt_l = [
                                'what can i say...',
                                'Vector sucks!',
                                'wasup!wasup!',
                                'no drugs! no porns! no gambling!',
                                "That's b*llsh*t!",
                                'look at that, what a poor guy!',
                                'everybody lights up!',
                                "love u! let's party!",
                                'Excuse me!',
                                "nobody's fault but mine",
                                'hold on hold on!!!',
                                'Guess what!',
                                'as you wish!',
                                'keep seafty!',
                                'you are so mean to me！',
                                "Eyyo, what's going on!",
                                'i got it! f**k outta here!'
                            ]
                            random_id = random.randint(0, len(txt_l) - 1)
                            Bob_Form.send_txt(self, txt_l[random_id], 1)
                except:
                    pass
        # recursive case
        sol_going_right = self.solve_recive_helper(content, position+1)
        if sol_going_right is None:
            return self.solve_recive_helper(content, position)

    def run(self):
        self.solve_recive_helper(self.content, receive.position)

    def stop(self):
        print('position at stop {}'.format(receive.position))
        self.is_running = False
        self.terminate()
if __name__ == "__main__":
    app = QtWidgets.QApplication(sys.argv)
    app.setStyle('Fusion')
    QtWidgets.QApplication.processEvents()
    Form = QtWidgets.QWidget()
    ui = Bob_Form()
    ui.setupUi(Form)
    Form.show()
    sys.exit(app.exec_())