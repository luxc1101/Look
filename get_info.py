import requests 
from bs4 import BeautifulSoup as bs
import pandas as pd
import re

'nick_20QEy'
'text_290DO'
r = requests.get('https://look.163.com/live?id=316155009')
webpage = bs(r.content,features="lxml")
de = webpage.find('span', attrs = {'class': 'nick_20QEy'})
print(de)
