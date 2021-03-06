import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native-elements'
import * as BASE from '../api/base'
import { navigate } from '../navbar/rootNavigation'
import ProgressHUB from './ProgressHUB/ProgressHUB';



const UpComming = ({ list, find_dimesions, top20 }) => {

    const [progressVidiable, setProgressVisiable] = useState(true)
    useEffect(() => {
        if (list) {
            setProgressVisiable(false)
        }
    }, [list])



    return (
        <>
            {progressVidiable ? <ProgressHUB visible={progressVidiable} /> :
                <View style={{ paddingHorizontal: 10 }}
                    onLayout={find_dimesions}>
                    {list && list.map((item, index) => {
                        let time = new Date(item.release_date)
                        return (
                            <TouchableOpacity key={`${index}+l`}
                                onPress={() => navigate('MovieDetail', item)}
                                style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                {top20 ? 
                                <View style = {{marginTop:20, marginRight:10}}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}>{index+1 >= 10 ? index+1 : `0${index+1}`}</Text>
                                </View> : 
                                <View style={{ marginRight: 5, alignItems: 'center' }}>
                                <Text style={{ color: '#c9c9c9' }}>{`THG ${time?.getMonth()}`}</Text>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{time.getDate() < 10 ? `0${time.getDate()}` : time.getDate()}</Text>
                            </View>}
                                <View style={{ marginBottom: 10, flex: 1 }}>
                                    <Image source={{ uri: `${BASE.BASE_URL_POSTER}${item?.backdrop_path}` }}
                                        containerStyle={styles.image}
                                        PlaceholderContent={<ActivityIndicator color='red' size='large' />}
                                        placeholderStyle={{ flex: 1, backgroundColor: 'white' }}
                                        resizeMode='stretch' />
                                    <Text style={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                        marginBottom: 10
                                    }}>{item?.title}</Text>
                                    <Text style={{ color: '#c9c9c9', marginBottom: 10 }}
                                        numberOfLines={5}>{item?.overview}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                        {item?.category && item?.category?.map((kind, indexK) => {
                                            if (indexK !== item?.category?.length - 1) {
                                                return (
                                                    <View style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                        key={`${indexK}o`}>
                                                        <Text style={{
                                                            color: 'white',
                                                            fontSize: 10,
                                                            fontWeight: 'bold',
                                                            marginBottom: 10,
                                                        }}>{kind?.name}</Text>
                                                        <View style={{
                                                            width: 5,
                                                            height: 5,
                                                            borderRadius: 10,
                                                            backgroundColor: 'red',
                                                            marginHorizontal: 3,
                                                            marginTop: -10
                                                        }} />
                                                    </View>
                                                )
                                            } else {
                                                return (
                                                    <View style={{
                                                        alignItems: 'center',
                                                        flexDirection: 'row',
                                                        justifyContent: 'center'
                                                    }}
                                                        key={`${indexK}o`}>
                                                        <Text style={{
                                                            color: 'white',
                                                            fontSize: 10,
                                                            fontWeight: 'bold',
                                                            marginBottom: 10
                                                        }}>{kind?.name}</Text>
                                                    </View>
                                                )
                                            }

                                        })}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>}
        </>
    );
};

export default UpComming;

const styles = StyleSheet.create({
    image: {
        height: 160,
        width: '100%',
        borderRadius: 10,
        marginBottom: 10
    }
});
