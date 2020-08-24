import requests 
from bs4 import BeautifulSoup as bs
import pandas as pd
import re

r = requests.get('https://look.163.com/live?id=316155009')

webpage = bs(r.content, features='lxml')

paragraphs = webpage.select('span')
print(paragraphs)

