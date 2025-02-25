import {
  getAllBudget,
  getTransactionForDateRange,
} from "@/services/apiServices";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BudgetCard } from "../budgets/BudgetCard";
import { TransactionCard } from "../transaction/transactionCard/TransactionCard";

interface BarChartDataForDateTransaction {
  categoryName: string;
  Amount: number;
  Budget: number;
}

function MonthlyBudgetVsEx() {
  const [barChartData, setBarChartData] = useState<
    BarChartDataForDateTransaction[]
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    const today = DateTime.now().endOf("month");
    const firstDayOfMonth = today.startOf("month");
    try {
      const [transactions, budgets] = await Promise.all([
        getTransactionForDateRange(
          firstDayOfMonth.toJSDate(),
          today.toJSDate(),
        ),
        getAllBudget(),
      ]);
      setBarChartData(
        transformTransactionsToBarChartData(transactions, budgets),
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const transformTransactionsToBarChartData = (
    transactionData: TransactionCard[],
    budgetData: BudgetCard[],
  ): BarChartDataForDateTransaction[] => {
    const dataObj = transactionData.reduce<{ [key: string]: number }>(
      (acc, curr) => {
        return {
          ...acc,
          [curr.category]: (acc[curr.category] || 0) + curr.amount,
        };
      },
      {},
    );

    return Object.entries(dataObj).map(([categoryName, Amount]) => {
      return {
        Amount,
        Budget:
          budgetData.find((el) => el.category === categoryName)?.budget || 0,
        categoryName,
      };
    });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="h-[40vh] w-full">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart width={150} height={40} data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis stroke="white" dataKey="categoryName" />
            <YAxis stroke="white" />
            <Tooltip formatter={(value) => `$${value}`} />
            <Legend />
            <Bar dataKey="Amount" fill="#8884d8" />
            <Bar dataKey="Budget" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="font-bold">Monthly exnpenses vs budget</div>
    </div>
  );
}

export default MonthlyBudgetVsEx;
