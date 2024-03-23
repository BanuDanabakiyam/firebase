// const functions = require('firebase-functions');
// const axios = require('axios');

// async function calculateDistanceUsingAPI(orderLocation, deliveryPartnerLocation) {
//     try {
//         const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
//             params: {
//                 origins: `${orderLocation.location.geopoint[0]},${orderLocation.location.geopoint[1]}`,
//                 destinations: `${deliveryPartnerLocation.locationCordinates[0]},${deliveryPartnerLocation.locationCordinates[1]}`,
//                 key: 'AIzaSyAs3PWPbBMyFsNv9R-OKFbEaOO9VAHuB4c'
//             }
//         });


//             const distance = Math.floor(response.data.rows[0].elements[0].distance.value/1000);
//             return distance;
        
//     } catch (error) {
//         return Infinity;
//     }
// }


// async function fetchOrders() {
//     const ordersData = [{
//         id: 'Order-1',
//         location:{
//             geopoint:[11.57437472572155, 77.63701636344194]

//         },
//     },
//     {
//         id: 'Order-2',
//         location: {
//             geopoint:[11.548182234564376, 77.63119395822287]
        
//         }
//     },
//     {
//         id: 'Order-3',
//         location: {
//             geopoint:[11.594887837228315, 77.6749649271369]

//         }
//     }
//     ];

//     return ordersData;
// }

// async function fetchDeliveryPartners() {
//     const deliveryPartners = [
//     {
//         id:'DeliveryPartner-1',
//         locationCordinates:[11.0583296, 76.9954317]
//     },
//     {
//         id:'DeliveryPartner-2',
//         locationCordinates:[11.0310, 77.0436]
//         },
//     {
//         id:'DeliveryPartner-3',
//         locationCordinates:[11.0174,76.9569]
//     }
        
//     ];

//     return deliveryPartners;
// }

// exports.findNearestDistanceForOrders = functions.https.onRequest(async (req, res) => {
//     if (req.method !== 'GET') {
//         return res.status(400).send("Invalid request");
//     }

//     try {
//         const orders = await fetchOrders();
//         const deliveryPartners = await fetchDeliveryPartners();
//         const nearestDistances = [];
//         let availabeleDelivery = [...deliveryPartners];


//         for (const order of orders) {
//             let shortestDistance = Infinity;
//             let nearestDeliveryPartner = '';
  
//             for (const deliveryPartner of availabeleDelivery) {
//                 functions.logger.log("Delivery",deliveryPartner.id);
                
//                 const distance = await calculateDistanceUsingAPI(order, deliveryPartner);

//                 if (distance < shortestDistance) {
//                     shortestDistance = distance;
//                     nearestDeliveryPartner = deliveryPartner.id;

//                 }
//             }
//             availabeleDelivery = availabeleDelivery.filter(obj => obj.id !== nearestDeliveryPartner);
//             nearestDistances.push({ OrderId: order.id, NearestDeliveryPartnerId: nearestDeliveryPartner, DistanceInKM: shortestDistance });
//         }
//         return res.status(200).json(nearestDistances);
//     } catch (error) {
//         console.error('Error:', error.message);
//         return res.status(500).send('Internal Server Error');
//     }
// });



const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const functions = require('firebase-functions');
const axios = require('axios');


initializeApp();
const firestoredb = getFirestore();

async function calculateDistanceUsingAPI(orderLocation, deliveryPartnerLocation) {
    
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: `${orderLocation.latitude},${orderLocation.longitude}`,
                destinations: `${deliveryPartnerLocation.locationCordinates[0]},${deliveryPartnerLocation.locationCordinates[1]}`,
                key: 'AIzaSyAs3PWPbBMyFsNv9R-OKFbEaOO9VAHuB4c'
            }
        });
            if(response.data && response.data.status === 'OK' && response.data.rows && response.data.rows.length > 0){
                return Math.floor(response.data.rows[0].elements[0].distance.value/1000);
            }else {
                console.log("Unsuccessful response from API : ",response.data.status);
                return Infinity;
            }
            
    } catch (error) {
        // console.log("Error : ",error)
        return Infinity;
    }
}
async function fetchOrders() {
    try {
        const ordersData = await firestoredb.collection('orders').get();
        const orders = [];
        
        ordersData.forEach(doc => {
            const data = doc.data();
            const address = data.address;
            if(address.location){
                const geopoint = address.location.geopoint;
                if(geopoint){
                const latitude = geopoint._latitude;
                const longitude = geopoint._longitude;
                orders.push({ id: doc.id, latitude, longitude });
            }else{
                    console.log("Geopoint is undefined for order:", doc.id)
                }
                
            }else{
                console.log("Location data is undefined for order: ",doc.id)
            }
        });
       return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return []; 
    }
}

async function fetchDeliveryPartners() {
    try{
    //     const deliveryPartnersData = await firestoredb.collection('delivery_partners').get();
    //     const deliveryPartners = [];
    //     deliveryPartnersData.forEach(doc => {
    //     const data = doc.data();
    //     const locationCoordinates = data.locationCordinates;
    //     if(locationCoordinates){
    //         const latitude = locationCoordinates._latitude;
    //         const longitude = locationCoordinates._longitude;
    //         deliveryPartners.push({id : doc.id,latitude,longitude});
    //     }else{
    //         console.log(" Location data is undefined for order: ",doc.id)
    //     }
    // })
    // return deliveryPartners;
    const deliveryPartners = [
            {
                id:'DeliveryPartner-1',
                locationCordinates:[11.0583296, 76.9954317]
            },
            {
                id:'DeliveryPartner-2',
                locationCordinates:[11.0310, 77.0436]
                },
            {
                id:'DeliveryPartner-3',
                locationCordinates:[11.0174,76.9569]
            }
                
            ];
            return deliveryPartners;
        
    }catch(error){
        console.log('Error delivery orders: ', error);
        return [];
    }
    }
 
exports.findNearestDistanceForOrders = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(400).send("Invalid request");
    }

    try {
        const orders = await fetchOrders();

        const deliveryPartners = await fetchDeliveryPartners();
        const nearestDistances = [];
        let availabeleDelivery = [...deliveryPartners];
        
       for (const order of orders) {
            let shortestDistance = Infinity;
            let nearestDeliveryPartner = '';
  
            for (const deliveryPartner of availabeleDelivery) {

                
                const distance = await calculateDistanceUsingAPI(order, deliveryPartner);
                console.log("Distance ",distance);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestDeliveryPartner = deliveryPartner.id;
                }
            }
            availabeleDelivery = availabeleDelivery.filter(obj => obj.id !== nearestDeliveryPartner);
            nearestDistances.push({ OrderId: order.id, NearestDeliveryPartnerId: nearestDeliveryPartner, DistanceInKM: shortestDistance });
        }
        return res.status(200).json(nearestDistances);
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).send('Internal Server Error');
    }
});



