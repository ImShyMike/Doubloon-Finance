import json

with open("static/shop.json", "r", encoding="utf-8") as file:
    data = json.load(file)

values = data["value"]

minRates = []
maxRates = []
minRatesUs = []
maxRatesUs = []

for item in values:
    name = item["name"]
    price = item["priceGlobal"]
    priceUs = item["priceUs"]
    hoursMin = item["minimumHoursEstimated"]
    hoursMax = item["maximumHoursEstimated"]

    minRate = price / hoursMax
    maxRate = price / hoursMin

    minRateUs = priceUs / hoursMax
    maxRateUs = priceUs / hoursMin

    minRates.append(minRate)
    maxRates.append(maxRate)

    minRatesUs.append(minRateUs)
    maxRatesUs.append(maxRateUs)

    print(
        f"{name} - {round(minRate, 2)}, {round(maxRate, 2)}" \
        f"({round(minRateUs, 2)}, {round(maxRateUs, 2)})"
    )

minAverage = sum(minRates) / len(minRates)
maxAverage = sum(maxRates) / len(maxRates)

minAverageUs = sum(minRatesUs) / len(minRatesUs)
maxAverageUs = sum(maxRatesUs) / len(maxRatesUs)

print(
    f"Average: {round(minAverage, 2)}, {round(maxAverage, 2)}" \
    f"({round(minAverageUs, 2)}, {round(maxAverageUs, 2)})"
)
