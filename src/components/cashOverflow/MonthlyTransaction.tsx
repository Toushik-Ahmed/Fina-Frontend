import { getTransactionForDateRange } from "@/services/apiServices";
import { DateTime } from "luxon";
import randomcolor from "randomcolor";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TransactionCard } from "../transaction/transactionCard/TransactionCard";

interface LineChartDataForDateRange {
  [key: string]: string | number;
}

function MonthlyTransactionTrend() {
  const [lineChartData, setLineChartData] = useState<
    LineChartDataForDateRange[]
  >([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [uniqColorList, setUniqColorList] = useState<string[]>([]);

  const getThisMonthsData = async () => {
    const today = DateTime.now().endOf("month");
    const firstDayOfMonth = today.startOf("month");
    try {
      const currentData = await getTransactionForDateRange(
        firstDayOfMonth.toJSDate(),
        today.toJSDate(),
      );
      setLineChartData(transformTransactionsToLineChartData(currentData));
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const generateRandomColors = (amount: number) => {
    const newColors = [];
    for (let i = 0; i < amount; i++) {
      newColors.push(randomcolor({ luminosity: "light" }));
    }
    setUniqColorList([...newColors]);
  };

  const transformTransactionsToLineChartData: (
    transactionData: TransactionCard[],
  ) => LineChartDataForDateRange[] = (transactionData) => {
    const categoryList = new Set(transactionData.map((el) => el.category));
    setCategoryList(Array.from(categoryList));
    generateRandomColors(categoryList.size);
    console.log(uniqColorList);
    let current = DateTime.now().startOf("month");
    const dayNames = [];
    const daysInMonth = DateTime.now().daysInMonth;
    for (let i = 0; i < daysInMonth; i++) {
      dayNames.push(current.toFormat("dd LLL"));
      current = current.plus({ days: 1 });
    }
    const dataObj = transactionData.reduce<{
      [key: string]: {
        [key: string]: number;
      };
    }>((acc, curr) => {
      if (!curr.timestamp) {
        return acc;
      }
      const transactionDay = DateTime.fromISO(curr.timestamp).toFormat(
        "dd LLL",
      );
      if (acc[transactionDay]) {
        return {
          ...acc,
          [transactionDay]: {
            ...acc[transactionDay],
            [curr.category]:
              (acc[transactionDay][curr.category] || 0) + curr.amount,
          },
        };
      } else {
        return {
          ...acc,
          [transactionDay]: {
            [curr.category]: curr.amount,
          },
        };
      }
    }, {});
    return dayNames.map((day) => {
      const reducedDataForCategories = Array.from(categoryList).reduce<{
        [key: string]: number;
      }>((acc, curr) => {
        return { ...acc, [curr]: (dataObj[day] && dataObj[day][curr]) || 0 };
      }, {});

      return {
        dayname: day,
        ...reducedDataForCategories,
      };
    });
  };

  useEffect(() => {
    getThisMonthsData();
  }, []);
  return (
    <div className="m-4 h-[40vh] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          className="w-full"
          width={500}
          height={300}
          data={lineChartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis stroke="white" dataKey="dayname" />
          <YAxis stroke="white" />
          <Tooltip
            formatter={(value) => {
              return `$${value}`;
            }}
          />
          <Legend />
          {categoryList.map((cat, idx) => {
            return (
              <Line
                key={idx}
                type="monotone"
                dataKey={cat}
                stroke={uniqColorList[idx]}
                activeDot={{ r: 8 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      <div className="font-bold">Monthly exnpenses By category</div>
    </div>
  );
}

export default MonthlyTransactionTrend;
