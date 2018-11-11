import pymysql

connection = pymysql.connect(
    host='localhost', user='root',
    password='1999', db='itw2'
)

def get_results(db_cursor):
    desc = [d[0] for d in db_cursor.description]
    results = [res for res in db_cursor.fetchall()]
    return desc, results
