import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Alert,
    PickerLayoutAnimation,
    Picker,
    Platform,
    UIManager,
    Modal,
    TouchableHighlight,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
//import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions, ScrollView } from 'react-native';
import moment from 'moment';
import { Chart, ArcElement } from 'chart.js';
Chart.register(ArcElement);
import { Animated, LinearGradient } from 'react-native';
import { useSpring, animated } from 'react-spring';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';
import { Pie } from 'react-chartjs-2';
import { extendMoment } from 'moment-range';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Moment = extendMoment(moment);
const App = () => {
    const [date, setDate] = useState(1); // Change the initial value to a number
    const [month, setMonth] = useState(1); // Change the initial value to a number
    const [year, setYear] = useState(2023); // Change the initial value to a number
    const [showSummary, setShowSummary] = useState(true);
    const [shifted, setShifted] = useState(false);
    const [notes, setNotes] = useState('');
    const [unhideNotes, setUnhideNotes] = useState({ 'House Rent': true, Groceries: true });
    const [showNotes, setShowNotes] = useState(false); // State variable to track showNotes
    const [showBudget, setShowBudget] = useState(false);
    const [showTooltip, setShowTooltip] = useState(true);
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'first', title: 'Expenses' },
        { key: 'second', title: 'Trends' },
    ]);
    const [navItems, setNavItems] = useState([
        { name: 'House Rent', dailyExpenses: {}, icon: 'home', dailyNotes: {}, monthlyBudget: {} },
        { name: 'Groceries', dailyExpenses: {}, icon: 'shopping-basket', dailyNotes: {}, monthlyBudget: {} },
    ]);
    const [errorMsg, setErrorMsg] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [yearSelectedFromPicker, setYearSelectedFromPicker] = useState(moment().year());
    const [dateError, setDateError] = useState('');
    const [newPicker, setNewPicker] = useState('');
    const [itemError, setItemError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [monthError, setMonthError] = useState('');
    const [yearError, setYearError] = useState('');
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const handleIconClick = () => {
        setActiveTabIcon('budget');
        setShowNotes(true);
        setIsCalendarOpen(false);
        setIsGreyAreaClicked(true); // Add this line
    };
    const [timePeriod, setTimePeriod] = useState('Month'); // set initial value as 'Month'

    const handleBudgetIconClick = () => {
        setActiveTabIcon('allocate');
        setShowBudget(true);
        setModalVisible(true); // this line triggers the tooltip modal to be displayed
        setIsCalendarOpen(false);
        setIsGreyAreaClicked(true); // Add this line
    };
    function Expenses() {
        return (
            <View style={styles.tabContent}>
                <ScrollView>
                    <ExpensesScreen />
                </ScrollView>
            </View>
        );
    }

    function Stats() {
        return (
            <View style={styles.tabContent}>
                <ScrollView>
                    <TrendsScreen />
                </ScrollView>
            </View>
        );
    }

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const [showMore, setShowMore] = useState(false);
    const [textHeight, setTextHeight] = useState(0);

    const toggleShowMore = () => {
        setShowMore(!showMore);
    };

    // Determine how many items to show
    const itemsToShow = showMore ? navItems.length : 5; // Adjust this number as needed

    const TopBar = () => {
        return (
            <View style={styles.topBar}>
                <Text style={styles.logo}>Expense Tracker</Text>
                {/* <View style={styles.shineEffect} /> */}
            </View>
        );
    };
    const getFirstTwoLetters = (str) => {
        if (str) {
            const words = str.split(' ');
            if (words.length > 1) {
                return words[0][0].toUpperCase() + words[1][0].toUpperCase();
            } else {
                return str.substring(0, 2).toUpperCase();
            }
        } else {
            return '';
        }
    };

    function toggleNotes(name) {
        const nextValue = !unhideNotes[name]; // calculate the next value first

        setUnhideNotes((prevNotes) => ({
            ...prevNotes,
            [name]: nextValue, // use the next value here
        }));

        Animated.timing(heightAnimation[name], {
            toValue: nextValue ? 0 : 100, // and also here
            duration: 500,
            useNativeDriver: false,
        }).start();
    }

    const handleDelete = () => {
        setNotes([]);
        setItemError('');
    };
    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const startYear = 1990;
        const years = [];

        for (let year = currentYear; year >= startYear; year--) {
            years.push(year.toString());
        }

        return years;
    };

    const [fadeAnim] = useState(new Animated.Value(0))  // Initial value for opacity: 0
    const [heightAnim] = useState(new Animated.Value(0));  // Initial value for height: 0
    const [opacityAnim] = useState(new Animated.Value(0));  // Initial value for opacity: 0
    const [notesOpacityAnim] = useState(new Animated.Value(0)); // Initial value for opacity: 0

    const FadeInView = (props) => {

        React.useEffect(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }).start();
        }, [fadeAnim]);

        return (
            <Animated.View // Special animatable View
                style={{
                    ...props.style,
                    opacity: fadeAnim, // Bind opacity to animated value
                }}
            >
                {props.children}
            </Animated.View>
        );
    };

    const startExpandAnimation = () => {
        Animated.timing(
            heightAnim,
            {
                toValue: 130, // change this to whatever height you want the expanded component to be
                duration: 1000,
                useNativeDriver: false // because height cannot be animated using the native driver
            }
        ).start();

        // Start the opacity animation
        Animated.timing(
            opacityAnim,
            {
                toValue: 1, // Fully visible
                duration: 1500,
                useNativeDriver: true
            }
        ).start();
    };

    useEffect(() => {
        if (showBudget) startExpandAnimation();
        else {
            heightAnim.setValue(0); // Reset the animation if showBudget is false
            opacityAnim.setValue(0); // Reset the opacity
        }
    }, [showBudget]);


    const startNotesExpandAnimation = () => {
        // Start the height animation
        Animated.timing(
            heightAnim, // Assuming you're using the same heightAnim for notes as well
            {
                toValue: 210, // Height of the expanded component
                duration: 1000,
                useNativeDriver: false // height cannot be animated using the native driver
            }
        ).start();

        // Start the opacity animation
        Animated.timing(
            notesOpacityAnim,
            {
                toValue: 1, // Fully visible
                duration: 1500,
                useNativeDriver: true
            }
        ).start();
    };
    useEffect(() => {
        if (showNotes) startNotesExpandAnimation();
        else {
            heightAnim.setValue(0); // Reset the height animation if showNotes is false
            notesOpacityAnim.setValue(0); // Reset the opacity
        }
    }, [showNotes]);


    const renderHeader = () => {
        let startDate, endDate;
        return (
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)}>
                    <Text>&lt;</Text>
                </TouchableOpacity>
                <Text style={styles.calendarHeaderTitle}>
                    {viewMode === 'month' ? moment(currentMonth).format('MMMM YYYY') : `${startDate}-${endDate}`}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)}>
                    <Text>&gt;</Text>
                </TouchableOpacity>
            </View>
        );
    };
    const [isGreyAreaClicked, setIsGreyAreaClicked] = useState(false);

    const handleGreyAreaPress = () => {
        setActiveTabIcon(activeTab);
        setIsCalendarOpen(false);
        setIsGreyAreaClicked(false);
        setShowNotes(false); // Add this line
        setShowBudget(false);
    };

    const handleNewPickerChange = (value) => {
        setNewPicker(value);
        if (value === 'Month') {
            generateMonthPieChartData();
        } else if (value === 'Year') {
            generateYearPieChartData();
        }
    };


    const handleCalendarPress = (selectedDate) => {
        console.log('----------calendar press ------------');
        const selectedMoment = moment(selectedDate, 'YYYY-MM-DD');
        setDate(selectedMoment.format('D'));
        //setMonth(selectedMoment.format('M'));
        //setYear(selectedMoment.format('YYYY'));
        setIsCalendarOpen(false);
    };

    const handlePreviousDate = () => {
        const currentDate = moment(`${year}-${month}-${date}`, 'YYYY-MM-DD').subtract(1, 'day');
        setDate(Number(currentDate.format('DD')));
        setMonth(Number(currentDate.format('MM')));
        setYear(Number(currentDate.format('YYYY')));
    };

    const handleNextDate = () => {
        const currentDate = moment(`${year}-${month}-${date}`, 'YYYY-MM-DD').add(1, 'day');
        setDate(Number(currentDate.format('DD')));
        setMonth(Number(currentDate.format('MM')));
        setYear(Number(currentDate.format('YYYY')));
    };

    const [viewMode, setViewMode] = useState('month'); // week or month
    const [currentMonth, setCurrentMonth] = useState(moment().format('YYYY-MM')); // default to current month
    const [activeTab, setActiveTab] = useState('expenses');
    const [activeTabIcon, setActiveTabIcon] = useState('expenses');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const handleToggleCalendar = () => {
        setIsCalendarOpen(!isCalendarOpen);
    };

    useEffect(() => {
        const currentDate = new Date();
        console.log("========================= currentDate==================== ", currentDate.toDateString())
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
        const currentYear = currentDate.getFullYear();
        const dateString = `${currentYear}-${currentMonth}-${currentDay}`
        updateSelectedDate(dateString, currentMonth, currentYear)
        setDate(currentDay.toString());
        setMonth(currentMonth);
        setYear(currentYear.toString());
        //changeSelectedDateOnMonthOYearChange(`${}`)
    }, []);

    const changeMonth = (n) => {
        let m = moment(currentMonth);
        m.add(n, 'months');
        setCurrentMonth(m.format('YYYY-MM'));
        console.log('--------------------------------------', currentMonth);
    };

    const TrendsScreen = () => {
        const data = [];
        const dates = [];
        let labels = [];
        const format = 'YYYY-MM-DD';
        console.log("------- selected yaer and month------ ", moment(`${year}-${month}`, 'YYYY-MMM'))
        let date = moment(`${year}-${month}`, 'YYYY-MMM');
        const start = date.clone().startOf('month');
        const end = date.clone().endOf('month');
        const range = Moment.range(start, end);
        Array.from(range.by('days')).map((m) => dates.push(m.format(format)));
        console.log("====================== dates =============== ", dates[0])
        dates.forEach((date) => {
            let sum = 0;
            if (selectedItemIndex !== null) {
                if (navItems[selectedItemIndex].dailyExpenses[date]) {
                    sum += navItems[selectedItemIndex].dailyExpenses[date];
                }
            } else {
                navItems.forEach((item) => {
                    if (item.dailyExpenses[date]) {
                        sum += item.dailyExpenses[date];
                    }
                });
            }
            data.push(sum);
            labels.push(date);
        });

        const options = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false,
                    text: 'Chart.js Line Chart',
                },
            },
        };

        const chartData = {
            labels,
            datasets: [
                {
                    label: 'Dataset 1',
                    data: data,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
            ],
        };

        const generateMonthPieChartData = (date) => {
            let totalExpenses = 0;
            let isExpenseSet = false
            let itemExpenses = navItems.map((item) => {
                let expense = 0;
                dates.forEach((date) => {
                    expense += item.dailyExpenses[date] || 0;
                    console.log(']]]]]]]', date, item.dailyExpenses);
                });
                console.log('[[[[[[[[[[[', expense, dates);
                totalExpenses += expense;
                return {
                    name: item.name,
                    expense: expense,
                };
            });


            const data = {
                labels: itemExpenses.map((item) => item.name),
                datasets: [
                    {
                        label: '# of Votes',
                        data: itemExpenses.map((item) => (item.expense / totalExpenses) * 100),
                        backgroundColor: ['#FF6384', '#36A2EB', 'yellow', 'blue', 'green'],
                    },
                ],
            };

            return [data, totalExpenses];
        };

        const generateYearPieChartData = () => {
            let totalExpenses = 0;
            let itemExpenses = navItems.map((item) => {
                let expense = 0;
                const startOfYear = moment(year, 'YYYY').startOf('year'); // start date of the selected year
                const endOfYear = moment(year, 'YYYY').endOf('year'); // end date of the selected year
                const range = Moment.range(startOfYear, endOfYear);
                Array.from(range.by('days')).forEach((date) => {
                    expense += item.dailyExpenses[date.format('YYYY-MM-DD')] || 0;
                });
                totalExpenses += expense;
                return {
                    name: item.name,
                    expense: expense,
                };
            });
            console.log(`Total Expenses: ${totalExpenses}`);
            console.log('Item Expenses:', itemExpenses);
            const data = {
                labels: itemExpenses.map((item) => item.name),
                datasets: [
                    {
                        label: '# of Votes',
                        data: itemExpenses.map((item) => (item.expense / totalExpenses) * 100),
                        backgroundColor: ['#FF6384', '#36A2EB', 'yellow', 'blue', 'green'],
                    },
                ],
            };
            console.log('Generated Data for Pie Chart:', data);
            return [data, totalExpenses];
        };


        const chartDataPie = {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [
                {
                    label: '# of Votes',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
        let piechartData, totalExpenses;
        if (timePeriod === 'Month') {
            [piechartData, totalExpenses] = generateMonthPieChartData(selectedDate);
        } else {
            [piechartData, totalExpenses] = generateYearPieChartData();
        }

        if (totalExpenses === 0) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'red', fontSize: 20, marginTop: '40%', marginLeft: '10%' }}>No expenses added.Please fill expenses to view stats!</Text>
                </View>
            );
        }

        return (
            <View style={{ flex: 1, marginRight: 15, marginLeft: 5 }}>
                <View style={styles.chartContainer}>
                    <Line options={options} data={chartData} />
                </View>
                <View style={styles.statsContainer}>
                    <View style={{ flex: 1 }}>
                        <Pie data={piechartData} />
                    </View>
                </View>
            </View>
        );
    };

    const handleSelectNavItem = (index) => {
        if (selectedItemIndex === index) {
            setSelectedItemIndex(null);
            return;
        }
        setSelectedItemIndex(index);
        setAmount('');
    };

    const handleLongPressNavItem = (index) => {
        Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            { text: 'OK', onPress: () => setNavItems(navItems.filter((item, i) => i !== index)) },
        ]);
    };
    const handleDateBlur = (value, field) => {
        switch (field) {
            case 'date':
                setDate(value);
                if (!value) setDateError('Date is required');
                else setDateError('');
                break;
            case 'month':
                setMonth(value);
                if (!value) setMonthError('Month is required');
                else {
                    setMonthError('');
                    updateSelectedDate(selectedDate, value, year)
                }
                //handleDateSelect(moment(selectedDate))
                break;
            case 'year':
                setYear(value);
                if (!value) setYearError('Year is required');
                else {
                    setYearError('');
                    updateSelectedDate(selectedDate, month, value)
                }
                break;
            default:
                break;
        }
    };

    function getNumericMonth(monthName) {
        var date = new Date(monthName + ' 1, 2000');
        var monthNumber = date.getMonth() + 1;
        return monthNumber < 10 ? '0' + monthNumber : '' + monthNumber;
    }

    const updateSelectedDate = (dayDateString, selectedMonth = month, selectedYear = year) => {
        let fields = dayDateString.split('-');
        let date = selectedYear + '-' + getNumericMonth(selectedMonth) + '-' + fields[2];
        console.log(date);
        setSelectedDate(date);
        handleCalendarPress(date);
        setIsCalendarOpen(false);
        if (selectedItemIndex !== null) {
            setAmount(navItems[selectedItemIndex].dailyExpenses[date] || '');
        }
    }

    const handleDateSelect = (day) => {
        console.log(day, '********dayssssssssssssssssssssssssssssssssssss*******');
        let dayDateString = day.dateString
        console.log('----------', date);
        return updateSelectedDate(dayDateString)
        let fields = dayDateString.split('-');
        let date = year + '-' + getNumericMonth(month) + '-' + fields[2];
        console.log(date);
        setSelectedDate(date);
        handleCalendarPress(date);
        setIsCalendarOpen(false);
        if (selectedItemIndex !== null) {
            setAmount(navItems[selectedItemIndex].dailyExpenses[date] || '');
        }
        console.log('====================== handleDateSelect ');
    };
    const getIconFromName = (str) => {
        const words = str.split(' '); // split the string into an array of words
        let icon = '';
        for (let word of words) {
            if (word.length > 0) {
                icon += word[0].toUpperCase(); // add the first letter of each word to the icon string
            }
        }
        return icon;
    };
    const handleAddNewItem = () => {
        if (name.length > 25) {
            setItemError('Item name should be less than 25 characters!');
            return;
        }
        if (name.length <= 25 && itemError) {
            setItemError('');
        }

        if (!navItems.find((item) => item.name.toLowerCase() === name.toLowerCase())) {
            setNavItems((prevItems) => [
                ...prevItems,
                { name, dailyExpenses: {}, dailyNotes: {}, monthlyBudget: {}, icon: getFirstTwoLetters(name) },
            ]);
            setName('');
            const updatedHeightAnimations = { ...heightAnimation };
            updatedHeightAnimations[name] = new Animated.Value(0);
            console.log('=================== height animation=== add new item ====== ', name, updatedHeightAnimations);
            setHeightAnimation(updatedHeightAnimations);

            const updatedUnhideNotes = { ...unhideNotes };
            updatedUnhideNotes[updatedItem.name] = false;
            setUnhideNotes(updatedUnhideNotes);
            //heightAnimation[name] = useRef(new Animated.Value(0)).current;
        } else {
            setItemError('Item name already exists!');
        }
    };

    const handleInputChange = (value) => {
        if (value.length > 25) {
            setItemError('Item name should be less than 25 characters!');
        } else {
            setItemError('');
        }
        setName(value);
    };

    const handleSubmitForm = () => {
        if (!date) {
            setDateError('Date is empty, please select a date');
        } else {
            setDateError('');
        }

        if (selectedItemIndex === null || selectedItemIndex === undefined) {
            setItemError('Item is not selected, please select an item!');
        } else {
            setItemError('');
        }

        if (!amount) {
            setAmountError('Amount is not entered, please enter an amount!');
        } else {
            setAmountError('');
        }
        if (date && selectedItemIndex !== null && selectedItemIndex !== undefined && amount) {
            const updatedNavItems = [...navItems];
            const updatedItem = {
                ...updatedNavItems[selectedItemIndex],
                dailyExpenses: {
                    ...updatedNavItems[selectedItemIndex].dailyExpenses,
                    [selectedDate]: parseFloat(amount) || 0,
                },
                dailyNotes: {
                    ...updatedNavItems[selectedItemIndex].dailyNotes,
                    [selectedDate]: notes,
                },
                icon: updatedNavItems[selectedItemIndex].icon, // Make sure to preserve the icon
                notes: notes,
            };

            updatedNavItems[selectedItemIndex] = updatedItem;
            setNavItems(updatedNavItems);
            setAmount('');
            setNotes('');
            setShowNotes(false); // Hide the notes container
            setIsCalendarOpen(false); // Hide the calendar
            setIsGreyAreaClicked(false); // Reset the grey area click flag

            // useEffect(() => {
            // Object.keys(unhideNotes).forEach(itemName => {
            // Animated.timing(heightAnimation, {
            // toValue: unhideNotes[itemName] ? 100 : 0, // change to desired height
            // duration: 500, // change the duration as you like
            // useNativeDriver: false,
            // }).start();
            // });
            // }, [unhideNotes]);
        }
    };

    const handleBudgetSubmitForm = () => {
        if (!date) {
            setDateError('Date is empty, please select a date');
        } else {
            setDateError('');
        }

        if (selectedItemIndex === null || selectedItemIndex === undefined) {
            setItemError('Item is not selected, please select an item!');
        } else {
            setItemError('');
        }

        if (!amount) {
            setAmountError('Amount is not entered, please enter an amount!');
        } else {
            setAmountError('');
        }
        console.log('===7777777778888888 ------------ month ', month, '======= year ', year, '++++++++ date ', date);
        if (date && selectedItemIndex !== null && selectedItemIndex !== undefined && amount) {
            const updatedNavItems = [...navItems];
            const updatedItem = {
                ...updatedNavItems[selectedItemIndex],
                monthlyBudget: {
                    ...updatedNavItems[selectedItemIndex].monthlyBudget,
                    [month + '-' + year]: parseFloat(amount) || 0,
                },
            };

            updatedNavItems[selectedItemIndex] = updatedItem;

            setNavItems(updatedNavItems);

            setAmount('');
            setIsCalendarOpen(false); // Hide the calendar
            setIsGreyAreaClicked(false); // Reset the grey area click flag
            setShowBudget(false);
        }
    };

    const calculateTotalForMonth = (yearMonth) => {
        console.log(yearMonth);
        console.log(currentMonth);
        return navItems.reduce((total, item) => {
            const monthlyExpenses = Object.keys(item.dailyExpenses)
                .filter((date) => date.startsWith(yearMonth))
                .reduce((monthlyTotal, date) => monthlyTotal + item.dailyExpenses[date], 0);
            return total + monthlyExpenses;
        }, 0);
    };

    const calculateItemTotalForMonth = (yearMonth, index) => {
        console.log(yearMonth);
        console.log(currentMonth);
        let item = navItems[index];
        const monthlyExpenses = Object.keys(item.dailyExpenses)
            .filter((date) => date.startsWith(yearMonth))
            .reduce((monthlyTotal, date) => monthlyTotal + item.dailyExpenses[date], 0);
        return monthlyExpenses;
    };
    const calculateBudgetAmount = (yearMonth, index) => {
        console.log('kkkkkkkkkk ==== ', yearMonth);
        let item = navItems[index];
        if (!item.monthlyBudget[yearMonth]) return 0;
        console.log('mmmmmmmmm ', item.monthlyBudget[yearMonth]);
        return item.monthlyBudget[yearMonth];
        const monthlyBudget = Object.keys(item.monthlyBudget)
            .filter((date) => {
                console.log('kkjjhhgfgfff ===== ', date), date.startsWith(yearMonth);
            })
            .reduce((monthlyTotal, date) => monthlyTotal + item.monthlyBudget[date], 0);

        console.log(monthlyBudget, ' ----------------- ');
        return monthlyBudget;
    };
    const slideAnim = useRef(new Animated.Value(-500)).current; // Initial value for x-offset; -500 slides it out of screen to the left
    //const heightAnimation = { 'House Rent': useRef(new Animated.Value(0)).current, Groceries: useRef(new Animated.Value(0)).current };
    const [heightAnimation, setHeightAnimation] = useState({ 'House Rent': new Animated.Value(0), Groceries: new Animated.Value(0) });
    // useEffect(() => {
    // Object.keys(unhideNotes).forEach(itemName => {
    // Animated.timing(heightAnimation, {
    // toValue: unhideNotes[itemName] ? 100 : 0, // change to desired height
    // duration: 500, // change the duration as you like
    // useNativeDriver: false,
    // }).start();
    // });
    // }, [unhideNotes]);
    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            tension: 5,
            useNativeDriver: true,
        }).start();
    }, []);

    const onTextLayout = (name, e) => {
        //if(heightAnimation[name] !== 0) return

        let textHeight = e.nativeEvent.layout.height;
        console.log(' onlayout event firing? -----', textHeight, '********* height animation', heightAnimation[name]);
        setTextHeight(textHeight);
    };

    function BudgetBar({ budgetedAmount, expenseAmount }) {
        const totalWidth = 100; // the total width of the bar in pixels
        const barHeight = 9; // the height of the bar in pixels
        const overlap = 2; // the overlapping width in pixels

        const expenseWidth = expenseAmount <= budgetedAmount ? (expenseAmount / budgetedAmount) * totalWidth : totalWidth;
        const showBudgetBar = expenseAmount > 0 || budgetedAmount > 0;
        const remainingWidth = totalWidth - expenseWidth;

        if (showBudgetBar) {
            return (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: barHeight + 20 }}>
                    {budgetedAmount > 0 && (
                        <View
                            style={{
                                //backgroundColor: '#98fb98', // lighter shade of green
                                backgroundColor: '#FF8C00',
                                width: `${totalWidth}%`,
                                height: barHeight,
                                borderRadius: barHeight / 2,
                                borderBottomRightRadius: barHeight / 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                                justifyContent: 'center',
                                // alignItems: 'center',
                            }}
                        >
                            {expenseAmount <= budgetedAmount && (
                                <Text style={{ color: 'black', fontSize: 10, textAlign: 'right', paddingRight: 10 }}>{`$${budgetedAmount - expenseAmount
                                    }`}</Text>
                            )}
                        </View>
                    )}
                    {expenseAmount > 0 && (
                        <View
                            style={{
                                //backgroundColor: '#ff7f7f', // lighter shade of red
                                backgroundColor: '#000000',
                                width: `${expenseWidth}%`,
                                height: barHeight,
                                borderRadius: barHeight / 2,
                                paddingLeft: 10,
                                //borderBottomLeftRadius: barHeight / 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                                position: 'absolute',
                                justifyContent: 'center',
                                //alignItems: 'center',
                                left: 0,
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 10 }}>{`$${expenseAmount}`}</Text>
                        </View>
                    )}
                    {expenseAmount > budgetedAmount && budgetedAmount > 0 && <Text style={{ position: 'absolute', right: 0 }}>💥</Text>}
                </View>
            );
        } else {
            <View
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(0, 0, 0, 0.25)',
                }}
            ></View>;
        }
    }

    const CustomDayComponent = ({ date, marking, state }) => {
        const dayTotal = navItems.reduce((total, item) => total + (item.dailyExpenses[date.dateString] || 0), 0);

        const isSelected = date.dateString === selectedDate;

        return (
            <TouchableOpacity onPress={() => handleDateSelect(date)}>
                <View
                    style={[
                        {
                            flex: 1,
                            justifyContent: 'center',
                            padding: 10,
                            borderRadius: 20,
                        },
                        isSelected ? styles.selectedDateBackground : {},
                    ]}
                >
                    <Text style={{ textAlign: 'center', color: isSelected ? 'white' : 'black' }}>{date.day}</Text>
                    {dayTotal > 0 && (
                        <Text style={{ textAlign: 'center', fontSize: 10, color: isSelected ? 'white' : 'blue' }}>{`₹${dayTotal}`}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const itemAmountForDay = (amount) => {
        console.log(' ***** day amount ***** ', amount);
        return !amount ? 0 : amount;
    };
    const dailyTotal = navItems.reduce((total, item) => total + (item.dailyExpenses[selectedDate] || 0), 0);
    const ExpensesScreen = () => (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {selectedDate && (
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryTitle}>
                            <Text style={styles.summaryTitleText}>{date + ' ' + month + ' ' + year}</Text>
                        </View>
                        {navItems.slice(0, itemsToShow).map((item, index) => (
                            <View style={styles.summaryContent}>
                                <View style={styles.summaryTile} key={index}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        {['Groceries', 'House Rent'].includes(item.name) ? (
                                            <Icon
                                                name={item.icon}
                                                size={item.name === 'Groceries' ? 20 : 25}
                                                color="#FF8C00"
                                                style={{ paddingRight: 10 }}
                                            />
                                        ) : (
                                            <Text style={index === selectedItemIndex ? styles.iconselected : styles.icon}>
                                                {getFirstTwoLetters(item.name)}
                                            </Text>
                                        )}
                                        <Text style={styles.summaryLabel}>{item.name}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.summaryAmount}>{'₹' + itemAmountForDay(item.dailyExpenses[selectedDate])}</Text>
                                        {item.dailyNotes[selectedDate] && (
                                            <TouchableOpacity onPress={() => toggleNotes(item.name)} style={{ marginLeft: 10 }}>
                                                {console.log('&&&&', item.name)}
                                                <Icon name="chevron-down" size={10} color="#000" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                <Animated.View style={[styles.notesDisplayContainer, { height: heightAnimation[item.name], overflow: 'hidden' }]}>
                                    <Text onLayout={(e) => onTextLayout(item.name, e)} style={styles.notesText}>
                                        {item.dailyNotes[selectedDate]}
                                    </Text>
                                </Animated.View>
                            </View>
                        ))}

                        <View>
                            {navItems.length > itemsToShow && (
                                <TouchableOpacity onPress={toggleShowMore}>
                                    <Text style={{ color: '#FF8C00', alignItems: 'center', alignSelf: 'center', }}>Show More</Text>
                                </TouchableOpacity>
                            )}
                            {showMore && (
                                <TouchableOpacity onPress={toggleShowMore}>
                                    <Text style={{ color: '#FF8C00', alignItems: 'center', alignSelf: 'center', }}>Show Less</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.summarytotalContent}>
                            <Text style={styles.summaryLabel}> Total:</Text>
                            <Text style={styles.summaryAmount}>{'₹' + dailyTotal}</Text>
                        </View>
                    </View>
                )}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryTitle}>
                        <Text style={styles.summaryTitleText}>{month + ', ' + year}</Text>
                    </View>
                    {navItems.slice(0, itemsToShow).map((item, index) => (
                        <View>
                            <View style={styles.monthSummaryContent} key={index}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {['Groceries', 'House Rent'].includes(item.name) ? (
                                        <Icon
                                            name={item.icon}
                                            size={item.name === 'Groceries' ? 20 : 25}
                                            color="#FF8C00"
                                            style={{ paddingRight: 10 }}
                                        />
                                    ) : (
                                        <Text style={index === selectedItemIndex ? styles.iconselected : styles.icon}>
                                            {getFirstTwoLetters(item.name)}
                                        </Text>
                                    )}
                                    <Text style={styles.summaryLabel}>{item.name}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.summaryAmount}>{'₹' + calculateItemTotalForMonth(currentMonth, index)}</Text>
                                    <View style={{ width: 10 }} />
                                </View>
                            </View>
                            <View style={styles.summaryContent}>
                                <BudgetBar
                                    budgetedAmount={calculateBudgetAmount(month + '-' + year, index)}
                                    expenseAmount={calculateItemTotalForMonth(currentMonth, index)}
                                />
                            </View>
                        </View>
                    ))}
                    <View>
                        {navItems.length > itemsToShow && (
                            <TouchableOpacity onPress={toggleShowMore}>
                                <Text style={{ color: '#FF8C00', alignItems: 'center', alignSelf: 'center', }}>Show More</Text>
                            </TouchableOpacity>
                        )}
                        {showMore && (
                            <TouchableOpacity onPress={toggleShowMore}>
                                <Text style={{ color: '#FF8C00', alignItems: 'center', alignSelf: 'center', }}>Show Less</Text>
                            </TouchableOpacity>
                        )}
                        <View style={[styles.summarytotalContent, { marginBottom: 10 }]}>
                            <Text style={styles.summaryLabel}>Total:</Text>
                            <Text style={styles.summaryAmount}>{'₹' + calculateTotalForMonth(currentMonth)}</Text>
                        </View>
                    </View>
                </View>
            </View>
            {/* <View style={styles.centeredView}>
    <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
            setModalVisible(false);
        }}
    >
        <TouchableOpacity
            style={styles.centeredView}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
        >
            <View style={styles.modalView}>
                <Text style={styles.modalText}>Allocate your budget here!</Text>
            </View>
        </TouchableOpacity>
    </Modal>
</View> */}

        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={styles.nav}>
                <TopBar />
                <View style={styles.dummySection} />
                <View style={styles.navItemsContainer}>
                    {navItems.slice(0, itemsToShow).map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.navItem, index === selectedItemIndex ? styles.navItemSelected : {}]}
                            onPress={() => {
                                handleSelectNavItem(index);
                                setItemError('');
                            }}
                            onLongPress={() => handleLongPressNavItem(index)}
                        >
                            {['Groceries', 'House Rent'].includes(item.name) ? (
                                <Icon
                                    name={item.icon}
                                    size={item.name === 'Groceries' ? 20 : 25}
                                    color="#FF8C00"
                                    style={index === selectedItemIndex ? styles.iconselected : styles.icon}
                                />
                            ) : (
                                <Text style={index === selectedItemIndex ? styles.iconselected : styles.icon}>{

                                    getFirstTwoLetters(item.name)}</Text>
                            )}
                            <Text style={index === selectedItemIndex ? styles.navSelectedText : styles.navText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                    <TextInput
                        value={name}
                        onChangeText={handleInputChange}
                        placeholder="New item"
                        style={styles.input}
                        onSubmitEditing={handleAddNewItem}
                    />
                    {navItems.length > itemsToShow && (
                        <TouchableOpacity onPress={toggleShowMore}>
                            <Text style={{ color: '#FF8C00', alignItems: 'center', alignSelf: 'flex-end', }}>Show More</Text>
                        </TouchableOpacity>
                    )}
                    {showMore && (
                        <TouchableOpacity onPress={toggleShowMore}>
                            <Text style={{ color: '#FF8C00', alignItems: 'center', alignSelf: 'center', }}>Show Less</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {itemError && <Text style={styles.errorText}>{itemError}</Text>}

                <View style={styles.dateInputsRow}>
                    <TouchableOpacity
                        onPress={() => {
                            setIsCalendarOpen(true);
                            setDateError('');
                        }}
                    >
                        <View style={styles.dateInputContainer}>
                            {activeTabIcon !== 'stats' && (
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="Date"
                                    value={date}
                                    onChangeText={(value) => {
                                        setDate(value);
                                        if (!value) setDateError('Date is required');
                                        else setDateError('');
                                    }}
                                />
                            )}
                            {dateError && <Text style={styles.errorText}>{dateError}</Text>}
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={styles.dateInput}>
                                    <Picker
                                        style={[styles.picker, !!month && styles.pickerWithValue]}
                                        selectedValue={month}
                                        onValueChange={(value) => handleDateBlur(value, 'month')}
                                    >
                                        <Picker.Item label="January" value="January" />
                                        <Picker.Item label="February" value="February" />
                                        <Picker.Item label="March" value="March" />
                                        <Picker.Item label="April" value="April" />
                                        <Picker.Item label="May" value="May" />
                                        <Picker.Item label="June" value="June" />
                                        <Picker.Item label="July" value="July" />
                                        <Picker.Item label="August" value="August" />
                                        <Picker.Item label="September" value="September" />
                                        <Picker.Item label="October" value="October" />
                                        <Picker.Item label="November" value="November" />
                                        <Picker.Item label="December" value="December" />
                                    </Picker>
                                    <View style={[styles.highlight, { backgroundColor: 'lightblue', left: 0, width: '100%' }]} />
                                </View>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={styles.dateInput}>
                                    <Picker
                                        style={[styles.picker, !!month && styles.pickerWithValue]}
                                        selectedValue={year}
                                        onValueChange={(value) => handleDateBlur(value, 'year')}
                                    >
                                        {generateYearOptions().map((year) => (
                                            <Picker.Item key={year} label={year} value={year} />
                                        ))}
                                    </Picker>
                                </View>
                            </TouchableWithoutFeedback>

                            {activeTabIcon === 'stats' && (
                                <TouchableWithoutFeedback onPress={() => { }}>
                                    <View style={styles.dateInput}>
                                        <Picker
                                            style={[styles.picker, !!newPicker && styles.pickerWithValue]}
                                            selectedValue={timePeriod}
                                            onValueChange={(value) => setTimePeriod(value)}
                                        >
                                            <Picker.Item label="Month" value="Month" />
                                            <Picker.Item label="Year" value="Year" />
                                        </Picker>
                                    </View>
                                </TouchableWithoutFeedback>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                {showNotes && (
                    <Animated.View style={[styles.notesContainer, { height: heightAnim }]}>
                        <Animated.View style={{ opacity: notesOpacityAnim }}>
                            <View style={styles.textInputWrapper}>
                                <TextInput
                                    style={styles.notesTextbox}
                                    value={notes}
                                    onChangeText={(text) => {
                                        setNotes(text);
                                    }}
                                    placeholder="Enter notes..."
                                />
                            </View>
                            <View style={styles.textInputWrapper}>
                                <TextInput
                                    style={styles.amountTextbox}
                                    value={amount}
                                    onChangeText={(text) => {
                                        setAmount(text);
                                        setAmountError('');
                                    }}
                                    placeholder="Enter amount..."
                                />
                            </View>
                            {amountError && <Text style={styles.errorText}>{amountError}</Text>}
                            <View style={styles.buttonContainer}>
                                {errorMsg && (
                                    <View style={styles.errorContainer}>
                                        <Text style={styles.errorText}>{errorMsg}</Text>
                                    </View>
                                )}
                                <TouchableOpacity onPress={handleSubmitForm} style={[styles.button, styles.submitButton]}>
                                    <Text style={styles.buttonText}>Submit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowNotes(false);
                                        setIsGreyAreaClicked(false);
                                        setItemError('');
                                        setAmountError('');
                                        setDateError('');
                                    }}
                                    style={[styles.button, styles.cancelButton]}
                                >
                                    <Text style={styles.cancelbuttonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </Animated.View>
                )}

                {showBudget && (
                    <Animated.View style={[styles.notesContainer, { height: heightAnim }]}>
                        <Animated.View style={{ opacity: opacityAnim }}>

                            <View style={styles.textInputWrapper}>
                                <TextInput
                                    style={styles.amountTextbox}
                                    value={amount}
                                    onChangeText={(text) => {
                                        setAmount(text);
                                        setAmountError('');
                                    }}
                                    placeholder="Enter amount..."
                                />
                            </View>
                            {amountError && <Text style={styles.errorText}>{amountError}</Text>}
                            <View style={styles.buttonContainer}>
                                {errorMsg && (
                                    <View style={styles.errorContainer}>
                                        <Text style={styles.errorText}>{errorMsg}</Text>
                                    </View>
                                )}
                                <TouchableOpacity onPress={handleBudgetSubmitForm} style={[styles.button, styles.submitButton]}>
                                    <Text style={styles.buttonText}>Submit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowBudget(false);
                                        setIsGreyAreaClicked(false);
                                        setItemError('');
                                        setAmountError('');
                                        setDateError('');
                                    }}
                                    style={[styles.button, styles.cancelButton]}
                                >
                                    <Text style={styles.cancelbuttonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </Animated.View>
                )}
            </View>

            {isCalendarOpen && (
                <>
                    <TouchableOpacity style={styles.modalOverlay} onPress={handleGreyAreaPress} activeOpacity={1} />
                    <View style={[styles.calendarContainer, styles.calendarContainerAbove]}>
                        <Calendar
                            key={currentMonth}
                            current={currentMonth}
                            hideExtraDays
                            hideHeader={true}
                            onDayPress={handleCalendarPress}
                            markingType={'period'}
                            dayComponent={({ date, marking, state }) => (
                                <TouchableOpacity onPress={handleCalendarPress}>
                                    <CustomDayComponent date={date} marking={marking} state={state} />
                                </TouchableOpacity>
                            )}
                            theme={{
                                'stylesheet.calendar.header': {
                                    monthText: {
                                        color: 'transparent',
                                    },
                                },
                            }}
                        />
                    </View>
                </>
            )}

            {!isCalendarOpen && (
                <View style={styles.pageContent}>
                    {isGreyAreaClicked && (
                        <>
                            <TouchableOpacity style={styles.modalOverlay} onPress={handleGreyAreaPress} activeOpacity={1} />
                        </>
                    )}

                    {activeTab === 'expenses' && <Expenses />}
                    {activeTab === 'stats' && <Stats />}

                    <View style={styles.bottomTabs}>
                        <TouchableOpacity style={[styles.bottomTab]} onPress={handleBudgetIconClick}>
                            <Ionicons name="pricetag-outline" size={24} color={activeTabIcon === 'allocate' ? '#000' : '#999'} />
                            <Text style={styles.tabLabel}>Allocate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.bottomTab, activeTab === 'expenses' && styles.activeTab]}
                            onPress={() => {
                                setActiveTab('expenses');
                                setActiveTabIcon('expenses');
                            }}
                        >
                            <Ionicons name="wallet-outline" size={24} color={activeTabIcon === 'expenses' ? '#000' : '#999'} />
                            <Text style={styles.tabLabel}>Budget</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.bottomTab, activeTab === 'stats' && styles.activeTab]}
                            onPress={() => {
                                setActiveTab('stats');
                                setActiveTabIcon('stats');
                            }}
                        >
                            <Ionicons name="stats-chart-outline" size={24} color={activeTabIcon === 'stats' ? '#000' : '#999'} />
                            <Text style={styles.tabLabel}>Stats</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bottomTab]} onPress={handleIconClick}>
                            <Ionicons name="card-outline" size={24} color={activeTabIcon === 'budget' ? '#000' : '#999'} />
                            <Text style={styles.tabLabel}>Expenses</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* <TouchableOpacity onPress={handleIconClick} style={styles.circleIcon}>
 <View style={styles.circleBackground}>
 <Icon name="plus" size={44} color="white" />
 </View>
 </TouchableOpacity>
 <TouchableOpacity onPress={handleBudgetIconClick} style={styles.circleBudgetIcon}>
 <View style={styles.circleBackground}>
 <Icon name="plus" size={44} color="white" />
 </View>
 </TouchableOpacity> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 9999,
    },
    visible: {
        display: 'flex',
    },
    hidden: {
        display: 'none',
    },
    nav: {
        opacity: '95%',
        position: 'sticky',
        zIndex: 998,
        top: 0,
        backgroundColor: '#E5E5E5',

        //paddingVertical: 10,
    },
    navTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    dummySection: {
        backgroundColor: '#E5E5E5',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        height: 20,
        boxShadow: '0px -5px 5px 2px #FFFAF0',
    },
    navItemsContainer: {
        flexDirection: 'row',
        alignItems: 'left',
        flexWrap: 'wrap',
        marginBottom: 10,
        marginTop: -15,
        //boxShadow: '100px -5px 5px 2px #FFFAF0',
    },
    circleIcon: {
        position: 'fixed',
        alignItems: 'center',
        right: '20px', // Adjust this value as needed
        bottom: '50px', // Adjust this value as needed
        zIndex: 1000,
    },
    circleBackground: {
        width: 100,
        height: 100,
        borderRadius: 70,
        backgroundColor: '#FF8C00',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: '50%',
    },
    circleBudgetIcon: {
        position: 'fixed',
        alignItems: 'center',
        bottom: '50px',
        zIndex: 1000,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        //backgroundColor: '#ddd',
        backgroundColor: 'white',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        margin: 5,
        height: 40,
    },
    navItemSelected: {
        // backgroundColor: '#aaa',
        backgroundColor: '#FF8C00',
    },
    shiftedExpenseStatsBar: {
        marginTop: 800, // Adjust the margin top as needed
        // Add any other styles specific to the shifted expense and stats bar
    },

    notesContainer: {
        padding: 10,
        paddingVertical: 12,
        marginTop: 10,
        paddingLeft: 3.5,

        // Add any other styles specific to the notes container
    },
    notesDisplayContainer: {
        paddingLeft: 3.5,
    },
    calendarContainerAbove: {
        //position: "absolute",
        //top: "25%", // Adjust this value as per your requirement
    },
    amountTextbox: {
        flexDirection: 'row',
        height: 40, // Adjust the height as needed
        borderRadius: 4,
        borderColor: '#ccc',
        borderWidth: 1,
        backgroundColor: 'white',
        paddingLeft: 10,
        marginLeft: 0.5,
        //padding: 0,
        // Add any other styles specific to the notes textbox
    },
    notesTextbox: {
        flexDirection: 'row',
        height: 80, // Adjust the height as needed
        borderRadius: 4,
        borderColor: '#ccc',
        borderWidth: 1,
        backgroundColor: 'white',
        paddingLeft: 10,
        marginLeft: 0.5,
        //padding: 0,
        // Add any other styles specific to the notes textbox
    },
    dateInputsRow: {
        flexDirection: 'row',
        alignItems: 'left',
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'left',
    },

    dateInputWrapper: {
        width: 10,
        // Adjust the width as desired
    },
    dateInput: {
        flex: 1,
        height: 40,
        width: 100,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingLeft: 10,
        marginRight: 5,
        marginLeft: 5,
        backgroundColor: 'white',
        borderRadius: 5,
    },
    iconRightMargin: {
        marginRight: 5, // Adjust the spacing as desired
    },
    navSelectedText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
    navText: {
        fontSize: 16,
    },
    input: {
        width: 100,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        margin: 5,
        borderRadius: 5,
    },
    pageContent: {
        flex: 1,
        backgroundColor: '#E5E5E5',
        //padding: 20,
    },
    content: {
        backgroundColor: '#E5E5E5',
        flex: 1,
        padding: 7,
    },
    icon: {
        color: '#FF8C00',
        padding: 5,
    },
    iconselected: {
        padding: 5,
        color: 'white',
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    formContainer: {
        backgroundColor: 'white',
        // backgroundColor: '#F8F8FF',
        borderRadius: 20,
        padding: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    calendarContainer: {
        position: 'relative',
        width: '95%',
        top: -40, // Adjust the top position as needed
        left: 10, // Adjust the left position as needed
        backgroundColor: '#fff',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        zIndex: 10000,
    },

    summaryContainer: {
        //flex: 1,
        //boxShadow: '0px -5px 5px 2px #FFFAF0',
        flexDirection: 'column',
        justifyContent: 'center',
        shadowColor: '#000',
        width: '100%',
        // marginRight: 5,
        // marginLeft: 5,
        backgroundColor: 'white',
        borderRadius: 5,
        marginBottom: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    statsContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        shadowColor: '#000',
        width: '100%',
        height: 350,
        alignItems: 'center',
        marginRight: 5,
        marginLeft: 5,
        backgroundColor: 'white',
        borderRadius: 5,
        marginBottom: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    chartContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        shadowColor: '#000',
        width: '100%',
        height: 200,
        alignItems: 'center',
        marginRight: 5,
        marginLeft: 5,
        backgroundColor: 'white',
        borderRadius: 5,
        marginBottom: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    summaryTitle: {
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        marginTop: -10,
        marginLeft: -10,
        marginRight: -10,
        fontSize: 18,
        fontWeight: 'bold',
        height: 40,
        marginBottom: 30,
        alignSelf: 'stretch',
        justifyContent: 'center',
        color: 'white', // text color
        backgroundColor: '#FF8C00', // background color
    },
    summaryTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white', // text color
        textAlign: 'center',
    },
    summaryTile: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 10,
        justifyContent: 'space-between',
        //width: 310,
        marginRight: 5,
        marginLeft: 0,
        backgroundColor: 'white',
        padding: 10,
        // borderBottomWidth: 1, // Add a border at the bottom
        // borderBottomColor: 'rgba(0, 0, 0, 0.25)', // Specify the color for the border
        elevation: 0,
    },
    summaryContent: {
        //flex: 1,
        flexDirection: 'column',
        marginBottom: 10,
        justifyContent: 'space-between',
        //width: 310,
        marginRight: 5,
        marginLeft: 0,
        backgroundColor: 'white',
        padding: 10,
        borderBottomWidth: 1, // Add a border at the bottom
        borderBottomColor: 'rgba(0, 0, 0, 0.25)', // Specify the color for the border
        elevation: 0,
    },
    summarytotalContent: {
        //flex: 1,
        flexDirection: 'column',
        marginBottom: 10,
        justifyContent: 'space-between',
        //width: 310,
        marginRight: 5,
        marginLeft: 0,
        backgroundColor: 'white',
        padding: 10,
    },
    monthSummaryContent: {
        flex: 1,
        flexDirection: 'row',
        //marginBottom: 10,
        justifyContent: 'space-between',
        //width: 310,
        marginRight: 5,
        marginLeft: 0,
        backgroundColor: 'white',
        padding: 10,
        borderBottomWidth: 0, // Add a border at the bottom
        borderBottomColor: 'rgba(0, 0, 0, 0.25)', // Specify the color for the border
        elevation: 0,
    },
    summaryTotal: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 10,
        justifyContent: 'space-between',
        //width: 310,
        marginRight: 5,
        marginLeft: 0,
        backgroundColor: 'white',
        padding: 10,
        borderBottomWidth: 0, // Add a border at the bottom
        borderBottomColor: 'rgba(0, 0, 0, 0.25)', // Specify the color for the border
        elevation: 0,
    },
    summaryLabel: {},
    summaryAmount: {
        fontWeight: 'bold',
        textAlign: 'right', // Add this line to align the text to the right
        marginRight: 25
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
    },
    submitButton: {
        marginRight: 10,
        backgroundColor: '#FF8C00',
    },
    cancelButton: {
        marginLeft: 10,
        backgroundColor: 'white',
        borderColor: '#FF8C00',
        borderWidth: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    cancelbuttonText: {
        color: '#FF8C00',
        fontWeight: 'bold',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    calendarHeaderTitle: {
        fontSize: 50,
    },
    selectedDateBackground: {
        backgroundColor: '#FF8C00',
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 0,
        //position: 'sticky',
        //top: 0,
        // zIndex: 998,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        //width: '50%',
    },
    activeTab: {
        borderBottomWidth: 4,
        borderBottomColor: '#FF8C00',
    },
    inactiveTab: {
        borderBottomWidth: 1,
        borderBottomColor: 'grey',
    },
    tabText: {
        fontSize: 16,
    },
    tabContent: {
        flex: 1,
        justifyContent: 'center',
        //alignItems: 'center',
    },
    textInputWrapper: {
        marginBottom: 10,
        marginLeft: 0.5,
    },
    picker: {
        flex: 1,
        borderWidth: 0,
        margin: 0,
        padding: 0,
    },
    pickerWithValue: {
        borderWidth: 0,
        // Remove the border when there is a value
    },

    bottomTabs: {
        flexDirection: 'row',
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 60,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        zIndex: 500,
    },
    bottomTab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        color: '#000',
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        color: '#999',
    },

    topBar: {
        backgroundColor: '#000000',
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'white', // Customize the light color
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: -15,
    },
    shineEffect: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 150, // Adjust the width as desired
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        transform: [{ rotate: '45deg' }],
    },
    notesText: {
        fontSize: 12,
    },
    logo: {
        position: 'absolute',
        top: '30%',
        transform: 'translateY(-30%)',
        width: '100%',
        textAlign: 'center',
        color: '#FF8C00',
        fontFamily: 'YourCustomFont', // Customize the font
        fontSize: 24, // Customize the font size
        fontWeight: 'bold',
        //textShadow: '0 0 5px #ffffff, 0 0 10px #ffffff, 0 0 20px #ffffff, 0 0 30px #ff00de',
    },
    errorContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        borderRadius: 5,
    },
    errorText: {
        color: 'red',
        padding: 5,
        marginBottom: 5,
        fontSize: 12,
        marginLeft: 10,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 140,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    openButton: {
        backgroundColor: '#F194FF',
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        fontSize: 20,
        fontWeight: '100',
        textAlign: 'center',
    },
});

export default App;

