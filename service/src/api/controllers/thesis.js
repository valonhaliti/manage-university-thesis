import asyncHandler from '../utils/asyncHandler';
import moment from 'moment';
import { DATA_FETCHED_SUCCESS } from '../constants';
import { removeFalseyValues  } from '../utils/utilFunctionsForAPIs';
import '@babel/polyfill';
import thesis from '../model/thesis';
import thesisToUser from '../model/thesisToUser';
import thesisToKeyword from '../model/thesisToKeyword';

export const create = asyncHandler(async (req, res, next) => {
  if (req.userData.userType === 1) {
    return res.json(403).json({
      error: 'Vetëm studentët mund të postojnë temë të diplomës.'
    })
  }
  const thesisObj = removeFalseyValues({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    filepath: req.file && req.file.path,
    added_by: req.userData.userId
  });
  const responseCreateThesis = await thesis.create(thesisObj);
  thesisObj.id = responseCreateThesis.id;
  await thesisToUser.create({
    professor_id: req.body.professorId,
    student_id: req.userData.userId,
    thesis_id: thesisObj.id
  });
  if (req.body.keywords) {
    const keywords = JSON.parse(req.body.keywords);
    if (keywords.length > 0) {
      await thesisToKeyword.create({
        keywords,
        thesisId: thesisObj.id
      });
    }
  }
  return res.status(201).json({
    message: 'Thesis added in database successfully.',
    data: thesisObj
  });
});

export const get = asyncHandler(async (req, res, next) => {
  const { thesisId } = req.params;
  let response = await thesis.get(thesisId);

  let finalResponse = Object.assign({}, response[0]);
  finalResponse.keywords = [];
  
  if (response.length === 1) {
    finalResponse.keywords.push(response[0].keyword);
  } else if (response.length > 1) {
    for (const item of response) {
      finalResponse.keywords.push(item.keyword)
    } 
  }

  if (response.length > 0)
    return res.status(200).json({ message: DATA_FETCHED_SUCCESS, data: [ finalResponse ] });
  else
    return res.status(404).json({ message: 'Thesis not found' });
});

export const list = asyncHandler(async (req, res, next) => {
  let response = await thesis.list();
  response = {
    message: DATA_FETCHED_SUCCESS,
    count: response.length,
    data: response
  };
  return res.status(200).json(response);
});

export const listThesisByStatus = asyncHandler(async (req, res, next) => {
  const { status, from, to } = req.params;
  const response = await thesis.listThesisByStatus(status, from, to);
  return res.status(200).json({
    message: DATA_FETCHED_SUCCESS,
    data: response    
   })
});

export const update = asyncHandler(async (req, res, next) => {
  const oldThesis = await thesis.get(req.params.thesisId);
  
  const { statusOfThesis, datePicker } = req.body;
  let approved_by_departament_date, 
    delegation_date, 
    published_date;
  if (statusOfThesis) {
    // Check if 3 months have passed since it got approved by department
    const dateToBeCompared = datePicker ? moment(datePicker) : moment(); 
    if (
      (statusOfThesis === 'gati-per-komision' || statusOfThesis === 'komisioni-i-caktuar'|| statusOfThesis === 'e-kryer') 
      && 
      moment(oldThesis[0].approved_by_departament_date).add(3, 'months') > dateToBeCompared
    ) {
      return res.status(500).json({
        message: "Three months should pass after it gets approved by department."
      })      
    }

    if (statusOfThesis === 'aprovuar-departamenti') {
      approved_by_departament_date = datePicker;
    } else if (statusOfThesis === 'komisioni-i-caktuar') {
      delegation_date = datePicker;
    } else if (statusOfThesis === 'e-kryer') {
      published_date =  datePicker;
    }
  } else if (oldThesis[0].status !== 'shqyrtim' && oldThesis[0].status !== 'diskutim' 
    && oldThesis[0].status !== 'aprovuar-mentor' && req.file === undefined
  ) {
    // FIXME: We should modify only req.file !!!! not abstract and title (if status is approved)
    return res.status(500).json({
      message: "You can't modify this thesis anymore."
    })
  }

  const updateThesis = removeFalseyValues({
    delegation_date,
    approved_by_departament_date,
    published_date,
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    filepath: req.file && req.file.path,
    status: req.body.statusOfThesis,
    delegation_list: req.body.delegation_list
  });

  if (Object.keys(updateThesis).length > 0) {
    await thesis.update(updateThesis, req.params.thesisId);
  }

  if (req.body.keywords) {
    await thesisToKeyword.update({
      keywords: JSON.parse(req.body.keywords),
      thesisId: req.params.thesisId
    })
  }

  updateThesis.id = req.params.thesisId;
  return res.status(201).json({ message: 'Thesis updated with success', data: updateThesis });
});

export const remove = asyncHandler(async (req, res, next) => {
  await thesis.delete(req.params.thesisId);
  return res.status(201).json({ message: 'Successfully deleted!' });
});

export const getByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  let response = await thesis.getByUser(userId);
  response = {
    message: DATA_FETCHED_SUCCESS,
    count: response.length,
    data: response
  };
  return res.status(200).json(response);
});

export const downloadThesis = asyncHandler(async (req, res, next) => {
  res.download(`${process.env.PWD}/uploads/${req.params.fileName}`);
});
