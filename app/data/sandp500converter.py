import pandas

if __name__ == '__main__':
    data = pandas.read_csv('sandp500.csv')
    with open('sandp500.js', 'w') as f:
        f.write('exports.sandp500_list=[')

        first = True
        for symbol in data.Symbol:
            if not first:
                f.write(',')
            f.write('\'' + symbol + '\'')
            first = False

        f.write('];')
