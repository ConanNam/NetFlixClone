import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Share, Alert, PermissionsAndroid } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { Image, Button, Rating } from 'react-native-elements'
import { goback, navigate, navigateReplace } from '../navbar/rootNavigation';
import * as BASE from '../api/base'
import {
  getListColections,
  getTVDetail,
  getTvRecomendation,
  getTvState,
  getTvVideo,
  rateTv,
  markAsFavorite
} from '../api/Request';
import YoutubePlayer from "react-native-youtube-iframe";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { useSelector } from 'react-redux';
import { showAlert } from '../components/Alert';
import { TYPE } from '../components/Alert/constants';
import { ScrollView, FlatList } from 'react-native-gesture-handler';
import ytdl from "react-native-ytdl"
import RNFetchBlob from 'rn-fetch-blob';
import FileViewer from "react-native-file-viewer";


const queryParams = {
  api_key: BASE.API_KEY,
  language: 'vi'
}

const displayRuntime = (runTime) => {
  let hours = Math.trunc(runTime / 60);
  let minutes = runTime % 60;
  return hours + "g" + minutes + "p";
}


const TVDetail = ({ route }) => {
  const tvId = route?.params.id
  const [dataTv, setDataTv] = useState({});
  console.log("🚀 ~ file: TVDetail.js ~ line 22 ~ TVDetail ~ dataTv", dataTv)
  const sessionId = useSelector(state => state.authenReducer.sessionId)
  const accoutInfo = useSelector(state => state.accountReducer.info)
  const [showRate, setShowRate] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [rating, setRating] = useState(0)

  useEffect(() => {
    const fetchTvDetail = async () => {
      const response = await Promise.all([
        getTVDetail(tvId, queryParams),
        getTvVideo(tvId, { ...queryParams, language: 'en' }),
        getTvRecomendation(tvId, queryParams),
        getTvState(tvId, { api_key: BASE.API_KEY, session_id: sessionId })
      ])
      const data = {
        ...response[0].data,
        keyYoutube: response[1].data.results[0].key,
        recomended: response[2].data.results,
        state: response[3].data
      }
      setDataTv(data)
    }
    fetchTvDetail()
  }, [tvId])

  useEffect(() => {
    if (dataTv?.state?.rated) {
      setRating(dataTv?.state?.rated?.value)
    }
    if (dataTv?.state?.favorite) {
      setFavorited(true)
    }
  }, [dataTv?.state])

  useEffect(() => {
    if (dataTv?.belongs_to_collection?.id) {
      const fetchColection = async () => {
        const { error, data } = await getListColections(dataTv.belongs_to_collection.id, queryParams)
        setDataTv({ ...dataTv, listColection: data.parts })
      }
      fetchColection()
    }
  }, [dataTv?.belongs_to_collection?.id])

  const ratingCompleted = async (rating) => {
    const params = {
      query: {
        api_key: BASE.API_KEY,
        session_id: sessionId
      },
      body: {
        value: rating
      }
    }
    const { error, data } = await rateTv(tvId, params)
    if (data) {
      showAlert(TYPE.success, 'Success', 'Rating success!')
      setRating(rating)
    } else {
      console.log('error rate:>>', error)
      showAlert(TYPE.error, 'Error', 'Rating fail!')
    }
  }

  const handleFavorite = async () => {
    const params = {
      query: {
        api_key: BASE.API_KEY,
        session_id: sessionId
      },
      body: {
        media_type: 'tv',
        media_id: tvId,
        favorite: !favorited
      }
    }
    const { error, data } = await markAsFavorite(accoutInfo.id, params)
    if (data) {
      if(!favorited){
        showAlert(TYPE.success, 'Success', 'Add list favorite success!')
      }else {
        showAlert(TYPE.success, 'Success', 'Removed movie from list favorite success!')
      }
      setFavorited(!favorited)
    } else {
      console.log('error rate:>>', error)
      showAlert(TYPE.error, 'Error', 'Add fail!')
    }
  }


  const onShare = async () => {
    try {
      const result = await Share.share({
        message:
          `Chia sẻ Tv show yêu thích " ${dataTv.title ?? dataTv.name} " đến mọi người!!!, link : https://www.youtube.com/watch?v=${dataTv.keyYoutube}`,
        title:'Share the Tv show'
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log('shared 1')
        } else {
          // shared
          console.log('shared 2')
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('dismissed share')
        // dismissed
      }
    } catch (error) {
     showAlert(TYPE.error,'ERROR',error.message)
    }
  };


  const downloadURLsToFile = (URLs, path, progressCallback) => {
    return new Promise(async (resolve, reject) => {

      for (let i = 0; i < URLs.length; i++) {
        let { url, headers } = URLs[i];

        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to external storage to download the file',
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Denied!',
              'You need to give storage permission to download the file'
            );
            return;
          }

          //Alert.alert('Permission granted', 'Permission has been granted!');

          const fileAlreadyExists = await RNFetchBlob.fs.exists(path);
          if (fileAlreadyExists) {
            await RNFetchBlob.fs.unlink(path);
          }

          const res = await RNFetchBlob.config({
            path,
            overwrite: false,
          //   addAndroidDownloads : {
          //     useDownloadManager : true, // <-- this is the only thing required
          //     // Optional, override notification setting (default to true)
          //     notification : false,
          //     title : dataMovie.original_title,
          //     // Optional, but recommended since android DownloadManager will fail when
          //     // the url does not contains a file extension, by default the mime type will be text/plain
          //     mime : 'video',
          //     //description : 'File downloaded by download manager.'
          // }
          }).fetch('GET', url, headers)
            .progress((received, total) => {
              if (progressCallback) {
                progressCallback((received * (i + 1)) / (total * URLs.length));
              }
            })
            .catch(err => console.error(`Could not save:"${path}" Reason:`, err));

          const contentType = res.respInfo.headers['Content-Type'];
          if (contentType) {
            const extension = contentType.split('/')[1];
            path = `${path}.${extension}`;
            await RNFetchBlob.fs.mv(res.path(), path);
          }
          console.log('The file is saved to:', path);
          showAlert(TYPE.success,'Success', 'Tải xuống hoàn tất!')

          await FileViewer.open(path, { showOpenWithDialog: true }) // absolute-path-to-my-local-file.
                .then(() => {
                  // success
                  console.log('success')
                })
                .catch((error) => {
                  // error
                })

        } catch (e) {
          console.error(e);
          reject(e);
        }

      }
      resolve(path);

    });
  }

  const downloadedFile = async () => {
    const youtubeURL = `http://www.youtube.com/watch?v=${dataTv.keyYoutube}`;
    const urls = await ytdl(youtubeURL, { filter: format => format.container === 'mp4' });
    const path = RNFetchBlob.fs.dirs.DownloadDir + `/${dataTv.original_title ?? dataTv.name}`;
    console.log("🚀 ~ file: MovieDetail.js ~ line 218 ~ downloadedFile ~ path", path)

    Alert.alert(
      "Chú ý!!",
      "Việc download có thể mất trong vài phút, video sẽ được tải ẩn trên nền, trong quá trình tải vui lòng không thoát app, nhấn Ok để tiếp tục tải xuống!",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => await downloadURLsToFile(urls, path,
            (progress) => console.log(progress))
        }
      ]
    );
  }





  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={{
        flexDirection: 'row',
        position: 'absolute',
        alignItems: 'center',
        marginRight: 10,
        right: 10,
        top: 10
      }}>
        <TouchableOpacity style={{
          marginRight: 10,
          backgroundColor: 'gray',
          padding: 4,
          borderRadius: 50
        }}>
          <MaterialIcons name='cast' size={24} color='white' />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => goback()}
          style={{
            backgroundColor: 'gray',
            padding: 4,
            borderRadius: 50
          }}>
          <MaterialIcons name='close' size={24} color='white' />
        </TouchableOpacity>
      </View>
      <YoutubePlayer
        height={230}
        play={true}
        videoId={dataTv.keyYoutube}
      />
      <ScrollView style={{
        paddingHorizontal: 10,
        flex: 1,
      }}>
        <Text style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16
        }}>{dataTv.title}</Text>
        <View style={{ flexDirection: 'row', marginTop: 5, alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', marginTop: 5, alignItems: 'center' }}>
            <Text style={{ color: 'white' }}>{new Date(dataTv.release_date).getFullYear()}</Text>
            {dataTv.adult &&
              <Text style={{
                backgroundColor: 'gray',
                color: 'white',
                padding: 3,
                fontSize: 10,
                marginLeft: 5
              }}>18+</Text>}
            {dataTv.episode_run_time ? <Text style={{
              color: 'white',
              padding: 3,
              fontSize: 12,
              marginLeft: 5,
              fontWeight: '900'
            }}>{displayRuntime(dataTv.episode_run_time[0])}</Text> : null}
            <Text style={{
              borderColor: 'gray',
              borderWidth: 1,
              color: 'white',
              padding: 3,
              fontSize: 10,
              marginLeft: 5
            }}>FHD</Text>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{
              color: 'white',
              marginTop: 5,
              fontWeight: '600'
            }}>Đánh giá: </Text>
            <View style={{
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <MaterialIcons name='star' size={40} color='yellow' />
              <Text style={{
                position: 'absolute',
                alignSelf: 'center', fontSize: 10, fontWeight: 'bold'
              }}>{dataTv.vote_average}</Text>
            </View>
          </View>
        </View>

        <Button style={{
          width: '100%',
          height: 35,
          backgroundColor: 'white',
          marginTop: 5,
          borderRadius: 8,
          padding: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
          title='Phát'
          icon={() => <MaterialIcons name='play-arrow' size={16} color='black' />}
          titleStyle={{ color: 'black', fontSize: 12, fontWeight: '600', marginLeft: 5 }}
          buttonStyle={{ backgroundColor: 'white', marginBottom: 5 }} />
        <Button style={{
          width: '100%',
          height: 35,
          marginTop: 5,
          borderRadius: 8,
          padding: 0,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'gray'
        }}
          title='Tải xuống'
          icon={() => <MaterialCommunityIcons name='arrow-collapse-down' size={16} color='white' />}
          titleStyle={{ color: 'white', fontSize: 12, fontWeight: '600', marginLeft: 5 }}
          buttonStyle={{ backgroundColor: 'gray' }} 
          onPress = {() => downloadedFile()}/>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%'
        }}>
          <TouchableOpacity style={styles.btn}
            onPress={handleFavorite}>
            <AntDesign name={favorited ? 'check' : 'plus'} size={18} color='white' />
            <Text style={{ color: 'gray', fontSize: 13 }}>Danh sách</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn}
            onPress={() => setShowRate(!showRate)}>
            <MaterialCommunityIcons name='vote' size={18} color='white' />
            <Text style={{ color: 'gray', fontSize: 13 }}>Đánh giá</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn}
          onPress={() => onShare()}>
            <MaterialCommunityIcons name='share' size={18} color='white' />
            <Text style={{ color: 'gray', fontSize: 13 }}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
        {showRate && <Rating
          fractions={1}
          tintColor='black'
          ratingCount={10}
          showRating
          imageSize={36}
          onFinishRating={ratingCompleted}
          style={{ paddingVertical: 10 }}
          startingValue={rating}
        />}
        <Text style={{
          color: 'white',
          fontSize: 12,
          fontWeight: '800',
          marginTop: 10
        }}>{dataTv.overview}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Text style={{ color: 'gray', fontWeight: '800', fontSize: 10 }}>Thể loại: </Text>
          {dataTv?.genres?.map((x, index) => {
            if (index != dataTv.genres.length - 1) {
              return (
                <Text style={{
                  color: 'gray',
                  fontWeight: '800',
                  fontSize: 10
                }}
                  numberOfLines={1}>{`${x.name}, `}</Text>
              )
            } else if (dataTv.genres.length > 3) {
              return (
                <Text style={{
                  color: 'gray',
                  fontWeight: '800',
                  fontSize: 10,
                }}
                >...</Text>
              )
            }

          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Text style={{ color: 'gray', fontWeight: '800', fontSize: 10 }}>Hãng phim: </Text>
          {dataTv?.production_companies?.map((x, index) => {
            if (index != dataTv.production_companies.length - 1) {
              return (
                <Text style={{
                  color: 'gray',
                  fontWeight: '800',
                  fontSize: 10
                }}
                  numberOfLines={1}>{`${x.name}, `}</Text>
              )
            } else if (dataTv.production_companies.length >= 2) {
              return (
                <Text style={{
                  color: 'gray',
                  fontWeight: '800',
                  fontSize: 10,
                }}
                >...</Text>
              )
            }

          })}
        </View>
        <Text style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
          marginTop: 10
        }}
        >Các phần phim</Text>
        <FlatList
          data={dataTv.seasons}
          keyExtractor={(item, index) => (index + "w")}
          renderItem={({ item, index }) => {
            return (
              <View
                style={{ paddingRight: 5, paddingVertical: 10 }}
              >
                <Image
                  source={{ uri: BASE.BASE_URL_IMAGE + item.poster_path }}
                  containerStyle={{ height: 150, width: 100, borderRadius: 8, }}
                  resizeMode='stretch'
                />
              </View>
            )
          }}
          horizontal />
        <Text style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
          marginTop: 10
        }}
        >Recommented</Text>
        <FlatList
          data={dataTv.recomended}
          keyExtractor={(item, index) => (index + "r")}
          renderItem={({ item, index }) => {
            return (
              <TouchableOpacity
                style={{ paddingRight: 5, paddingVertical: 10 }}
                onPress={() => {
                  navigateReplace('TVDetail', item)
                }}>
                <Image
                  source={{ uri: BASE.BASE_URL_IMAGE + item.poster_path }}
                  containerStyle={{ height: 150, width: 100, borderRadius: 8, }}
                  resizeMode='stretch'
                />
              </TouchableOpacity>
            )
          }}
          horizontal />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TVDetail;

const styles = StyleSheet.create({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 60
  },
});
