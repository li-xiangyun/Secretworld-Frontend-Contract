/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Modal, Upload } from 'antd';
import ipfs from './utils/ipfs'
import axios from 'axios'

import 'antd/dist/antd.css';

//后端ip及端口
axios.defaults.baseURL = 'http://127.0.0.1:4000'

//通过hash 返回图片文件 显示到页面
function ipfscat(hash){
  return new Promise(function (resolve,reject){
    ipfs.files.cat(hash,async (err,buffer)=>{
      if(err){
        reject(err);
        return
      }
      //新构成图片文件
      var file = new File([buffer],"", {type:"image/png",lastModified:Date.now()});
      resolve(file);
    })
  })
}

const UploadImage = (props) =>{
  //预览
  const [previewVisible, setPreviewVisible] = useState(false);
  //预览图片
  const [previewImage, setPreviewImage] = useState('');
  //预览图片名字
  const [previewTitle, setPreviewTitle] = useState('');
  //图片uid
  var [index, setIndex] = useState(0);
  //图片列表
  const [fileList, setFileList] = useState([]);
  //关闭预览
  const handleCancel = () => setPreviewVisible(false);
  //拿到外部传入图片列表
  const {getFileList} = props;

  //图片预览
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise((resolve, reject) => {
        const reader = new window.FileReader()
        reader.readAsArrayBuffer(file.originFileObj)
        reader.onloadend = () => {resolve(reader.result)}
        reader.onerror = (error) => {reject(error)};
      })
    }
    let url = window.URL.createObjectURL(file.originFileObj);
    //设置图片内部url及名字
    setPreviewImage(url||file.url);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  //清空当前图片列表
  useEffect(()=>{
    if(JSON.stringify(fileList)!==undefined){
      const newFileList = fileList.slice();
      newFileList.splice(0);
      //返回给外部图片列表
      getFileList(newFileList);
      //内部图片列表
      setFileList(newFileList);
    }
  },[props.clearFlag]);

  //点图片一览后 获得当前秘密图片
  useEffect(()=>{
       //先清空图片列表
       var newFileList = fileList.slice()
       newFileList.splice(0);
       axios.get(`/secret/listSelect?id=${props.listid}&account=${props.acccount}`).then(async (result)=>{
        if(result.data.data !== null){
            for(var i = 0; i<result.data.data.content.length;i++){
              //构成新的图片文件
              var now = +new Date();
              var file = await ipfscat(result.data.data.content[i]);
              var uid = "rc-upload-".concat(now, "-").concat(++index);
              setIndex(index);
              var newfile ={
                uid: uid,
                lastModified : file.lastModified,
                lastModifiedDate : file.lastModifiedDate,
                name : file.name,
                originFileObj :file,
                percent :100,
                size : file.size,
                status : 'done',
                type : file.type
              };
              newFileList.push(newfile);
            }
            //更新图片列表
            setFileList(newFileList)
      }
    })
  },[props.editFlag]);

  //上传图片后更新图片列表
  const handleChange = ({file:file,fileList: newFileList }) => {
    if(file.status === 'error'){
      file.status = 'done';
    }
    //返回外部图片列表
    getFileList(newFileList);
    //更新内部图片列表
    setFileList(newFileList)
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{marginTop: 8}}>
        Upload
      </div>
    </div>
  );
  return (
    <div>
      {/* 图片上传区域 */}
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
      >
      {fileList.length >= 8 ? null : uploadButton}
      </Upload>
      {/* 图片详细区域 */}
      <Modal visible={previewVisible} title={previewTitle} footer={null} onCancel={handleCancel}>
        <img
          alt="example" style={{width: '100%'}}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export {UploadImage}