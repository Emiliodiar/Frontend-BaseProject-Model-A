/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getDetail, getRestaurantAnalytics, getRestaurantOrders } from '../../api/RestaurantEndpoints'
import { nextStatus } from '../../api/OrderEndpoints'

import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { API_BASE_URL } from '@env'
import pendingOrderImage from '../../../assets/order_status_pending.png'
import inProcessOrderImage from '../../../assets/order_status_in_process.png'
import sentOrderImage from '../../../assets/order_status_sent.png'
import deliveredOrderImage from '../../../assets/order_status_delivered.png'
import ImageCard from '../../components/ImageCard'

export default function OrdersScreen ({ navigation, route }) {
  const [restaurant, setRestaurant] = useState({})
  const [orders, setOrders]  = useState([])
  const [analytics, setAnalytics]  = useState([])

  useEffect(() => {
    fetchRestaurantDetail()
    fetchRestaurantOrders()
    fetchRestaurantAnalytics()
  }, [route])

  const fetchRestaurantAnalytics = async () => {
    try{
      const fetchedAnalytics= await getRestaurantAnalytics(route.params.id)
      setAnalytics(fetchedAnalytics)
    }catch(error){
      showMessage({
        message: `There was an error while retrieving the orders. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const fetchRestaurantOrders = async () => {
    try {
      const fetchedOrders = await getRestaurantOrders(route.params.id)
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving the orders. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const handleNextStatus = async (order) => {
    try {
      await nextStatus(order)
      await fetchRestaurantOrders()
      showMessage({
        message: `Order ${order.id} succesfully advanced`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      console.log(error)
      showMessage({
        message: `Order ${order.id} could not be advanced.`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }

  }

  const renderAnalytics = () => {
    return (
      <View style={styles.analyticsContainer}>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCell}>
              <TextRegular textStyle={styles.text}>
                Invoiced today
              </TextRegular>
              <TextSemiBold textStyle={styles.text}>
                {analytics.invoicedToday}.00€
              </TextSemiBold>
            </View>
            <View style={styles.analyticsCell}>
              <TextRegular textStyle={styles.text}>
                #Pending orders
              </TextRegular>
              <TextSemiBold textStyle={styles.text}>
                {analytics.numPendingOrders}
              </TextSemiBold>
            </View>
          </View>

          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCell}>
                <TextRegular textStyle={styles.text}>
                  #Delivered today
                </TextRegular>
                <TextSemiBold textStyle={styles.text}>
                  {analytics.numDeliveredTodayOrders}
                </TextSemiBold>
              </View>
              <View style={styles.analyticsCell}>
                <TextRegular textStyle={styles.text}>
                  #Yesterday orders
                </TextRegular>
                <TextSemiBold textStyle={styles.text}>
                  {analytics.numYesterdayOrders}
                </TextSemiBold>
              </View>
          </View>
        </View>
    )
  }
  const renderHeader = () => {
    return (
      <View>
        <ImageBackground source={(restaurant?.heroImage) ? { uri: API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : undefined} style={styles.imageBackground}>
          <View style={styles.restaurantHeaderContainer}>
            <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
            <Image style={styles.image} source={restaurant.logo ? { uri: API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined} />
            <TextRegular textStyle={styles.description}>{restaurant.description}</TextRegular>
            <TextRegular textStyle={styles.description}>{restaurant.restaurantCategory ? restaurant.restaurantCategory.name : ''}</TextRegular>
          </View>
        </ImageBackground>
        {analytics!== null && renderAnalytics()}
      </View>
    )
  }

  const getOrderImage = (status) => {
    switch (status) {
      case 'pending':
        return pendingOrderImage
      case 'in process':
        return inProcessOrderImage
      case 'sent':
        return sentOrderImage
      case 'delivered':
        return deliveredOrderImage
    }
  }

  const renderOrder = ({ item }) => {
    return(
      <ImageCard
        imageUri={getOrderImage(item.status)}
        title={item.createdAt}
        onPress={() => {
          navigation.navigate('EditOrderScreen', { id: item.id })
        }}
        style={styles.orderCard}
      >
        <TextRegular>
        Status:{' '}
          <TextRegular textStyle={{ color: GlobalStyles.brandPrimary }}>
           {item.status}
         </TextRegular>
        </TextRegular>
        <TextRegular>
          Address: {''}
          <TextRegular textStyle={{ color: GlobalStyles.brandPrimary }}>
           {item.address}
         </TextRegular>
         </TextRegular>
        <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>
          {item.price.toFixed(2)}€
        </TextSemiBold> 
        <View style={styles.actionButtonsContainer}>
          <Pressable
            onPress={() => navigation.navigate('EditOrderScreen', { id: item.id })}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? GlobalStyles.brandBlueTap : GlobalStyles.brandBlue
              },
              styles.actionButton
              ]}>
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name='pencil' color={'white'} size={20} />
              <TextRegular textStyle={styles.text}> Edit </TextRegular>
            </View>
          </Pressable>
          {item.status != 'delivered' &&
          <Pressable
            isVisible={!item.status === 'delivered'}
            onPress={() => handleNextStatus(item)}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? GlobalStyles.brandGreenTap : GlobalStyles.brandGreen,
              },
              styles.actionButton,
            ]}>
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="skip-next" color={'white'} size={20} />
              <TextRegular textStyle={styles.text}> Advance </TextRegular>
            </View>
          </Pressable>
          }
        </View>
      </ImageCard>
    )
  }

  const renderEmptyOrdersList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        This restaurant has no orders yet.
      </TextRegular>
    )
  }

  const fetchRestaurantDetail = async () => {
    try {
      const fetchedRestaurant = await getDetail(route.params.id)
      setRestaurant(fetchedRestaurant)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <FlatList
      ListHeaderComponent={renderHeader}
      style={styles.container}
      keyExtractor={item => item.id.toString()}
      data={orders}
      renderItem={renderOrder}
      renderEmptyComponent={renderEmptyOrdersList}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  image: {
    height: 100,
    width: 100,
    margin: 10
  },
  description: {
    color: 'white'
  },
  textTitle: {
    fontSize: 20,
    color: 'white'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  },
  analyticsContainer: {
    backgroundColor: GlobalStyles.brandPrimaryTap,
    paddingVertical: 10
  },
  analyticsRow: {
    flex: 'center',
    textAlign: 'justify',
    flexDirection:'row',
    alignSelf: 'center',
    width:'80%'
  },
  analyticsCell: {
    margin: 10,
    color: 'white',
    fontSize: 12,
    width: '45%',
    backgroundColor: GlobalStyles.brandPrimary,
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.41,
    shadowRadius: 3.11,
    elevation: 2
  }
})
