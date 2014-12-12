// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
AV.Cloud.define("hello", function(request, response) {
	var Test = AV.Object.extend("Test");
	var test = new Test();
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var f1 = fso.GetFile("C:\Users\KeCC\Desktop\test.jpg");
	var file = new AV.File("test.jpg", f1);
	file.save({
		success: function(file) {
			response.success(file);
		},
		error: function(err) {
			response.error(err);
		}
	});
});
//用户注册
AV.Cloud.define("userReg", function(request, response) {
	var user = new AV.User();
	// 	console.log(request.params);
	var fq = new AV.Query(AV.File);

	console.log(request.params.photo.id);
	fq.get(request.params.photo.id, {
		success: function(photo) {

			var opt = {
				username: request.params.username,
				password: request.params.password,
				nickname: request.params.nickname,
				email: request.params.email,
				Relatived: request.params.Relatived ? {
					__type: "Pointer",
					className: "Relatived",
					objectId: request.params.Relatived
				} : null,
				Score: request.params.Score || 0,
				sex: request.params.sex || "female",
				photo: photo || null
			};
			console.log(opt);

			user.signUp(opt, {
				success: function(result) {
					response.success(result);
				},
				error: function(obj, err) {
					response.error(err);
				}
			});

		},
		error: function(err) {
			response.error(err);
		}

	});
});
//用户登陆
AV.Cloud.define("userLogin", function(request, response) {
	var user = new AV.User();
	AV.User.logIn(request.params.username, request.params.password, {
		success: function(user) {
			var Relative = AV.Object.extend("Relatived");
			var relativeQuery = new AV.Query(Relative);
			if (user.attributes.sex == "female") {
				relativeQuery.equalTo("Female", user);
				relativeQuery.find({
					success: function(rela) {
						if (rela.length === 0) return response.success("100");
						if (rela[0].attributes.isRelatived) {
							response.success(user._sessionToken);
						} else {
							response.success("100");
						}
					},
					error: function(rela, err) {
						response.error(err);
					}
				});
			} else {
				relativeQuery.equalTo("Male", user);
				relativeQuery.find({
					success: function(rela) {
						if (rela.length === 0) return response.success("100");
						if (rela[0].attributes.isRelatived) {
							response.success(user._sessionToken);
						} else {
							response.success("100");
						}
					},
					error: function(rels, err) {
						response.error(err);
					}
				});
			}

		},
		error: function(err) {
			console.log(err);
			response.error(err);
		}
	});

});

AV.Cloud.define("invite", function(request, response) {
	var Relative = AV.Object.extend("Relatived");
	var relaQuery = new AV.Query(Relative);

	var relative = new Relative();
	relaQuery.equalTo("invitor", request.user);
	relaQuery.find({
		success: function(rela) {
			if (rela.length) {
				console.log("已经存在邀请");
				response.error("已经存在邀请");
			} else {
				console.log("正在邀请");
				var opt = {
					invitor: {
						__type: "Pointer",
						className: "_User",
						objectId: request.params.invitorId
					},
					inviteCode: request.params.inviteCode,
					Female: (request.params.sex == "female") ? {
						__type: "Pointer",
						className: "_User",
						objectId: request.params.invitorId
					} : null,
					Male: (request.params.sex == "male") ? {
						__type: "Pointer",
						className: "_User",
						objectId: request.params.invitorId
					} : null,
					isRelatived: false
				};
				// console.log(opt);
				relative.save(opt, {
					success: function(relative) {
						response.success(relative);
					},
					error: function(relative, err) {
						response.error(err);
					}
				});
			}
		},
		error: function(rela, err) {
			response.error(err);
		}
	});
});

AV.Cloud.define("acceptInvite", function(request, response) {
	var Relative = AV.Object.extend("Relatived");
	var relativeQuery = new AV.Query(Relative);

	relativeQuery.equalTo("inviteCode", request.params.inviteCode);
	relativeQuery.find({
		success: function(data) {
			if (data.length === 0) return response.error("邀请码无效~");
			if (data[0].attributes.invitor.id == request.params.currentUserId)
				return response.error("此应用不适合一个人玩儿~");
			console.log("1");
			data[0].fetchWhenSave(true);
			data[0].set("inviteCode", null);
			data[0].set("Female", data[0].get("Female") !== null ? data[0].Female : {
				__type: "Pointer",
				className: "_User",
				objectId: request.params.invitorId
			});
			data[0].set("Male", data[0].get("Male") !== null ? data[0].Male : {
				__type: "Pointer",
				className: "_User",
				objectId: request.params.invitorId
			});
			data[0].set("isRelatived", true);

			data[0].save(null, {
				success: function(rela) {
					console.log("20");
					var relativeQuery = new AV.Query(Relative);
					relativeQuery.get(rela.id, {
						success: function(result) {
							console.log("3");
							//							console.log(result);
							var userquery = new AV.Query(AV.User);
							userquery.get(result.get("Female").id, function(female) {
								female.set("Relatived", result.id);
								return female.save();
							}).then(function() {
								userquery.get(result.get("Male").id, function(male) {
									male.set("Relatived", result.id);
									return male.save();
								});
							}).then(function(result) {
								console.log("30");
								response.success("匹配成功~！");
							}, function(error) {
								console.log("31");
								response.error("匹配失败~！");
							});
						},
						error: function(err) {
							//							response.error(err);
							response.error("匹配失败~！");
						}
					});
				},
				error: function(err) {
					console.log("21");
					//					response.error(err);
					response.error("匹配失败~！");
				}
			});
		},
		error: function(relative, err) {
			response.error(err);
		}
	});
});
//添加约定
AV.Cloud.define("addRules", function(request, response) {
	var currentUser = new AV.User();
	currentUser = request.user;
	// 	console.log(currentUser);
	var Relative = AV.Object.extend("Relatived");
	var relativeQuery = new AV.Query(Relative);
	if (currentUser.get("sex") == "female") {
		// console.log("female");
		relativeQuery.equalTo("Female", currentUser);
		relativeQuery.find({
			success: function(relative) {
				var Rules = AV.Object.extend("Rules");
				// console.log(relative[0].attributes);
				var rule = new Rules();
				rule.set('From', currentUser);
				rule.set('To', relative[0].attributes.Male);
				rule.set('Rules', request.params.Rules);
				rule.set('Score', request.params.Score);
				rule.set('Positive', request.params.Positive);
				rule.set('isActived', false);
				rule.save({
					success: function(rule) {
						var Records = AV.Object.extend("Record");
						var recordsRule = new Records();
						var opt = {
							From: rule.attributes.From,
							To: rule.attributes.To,
							Records: "增加约定",
							Score: rule.attributes.Score,
							Rules: rule.attributes.Rules
						};
						recordsRule.save(opt, {
							success: function(record) {

								AV.Push.send({
									//   where: query,
									channels: [relative[0].attributes.Male.id],
									expiration_interval: 1000 * 60 * 60 * 24,
									data: {
										alert: {
											rules: rule.get("Rules"),
											score: rule.get("Score"),
											type: 11
										},
										action: "com.pushdemo.action"
									}
								}, {
									success: function(push) {
										// console.log(push);
										response.success(rule);
									},
									error: function(obj, err) {
										//  console.log(obj);
										response.error(err);
									}
								});
							},
							error: function(obj, err) {
								response.error(err);
							}
						});
					},
					error: function(obj, err) {
						response.error(err);
					}
				});
			},
			error: function(relative, err) {
				response.error(err);
			}
		});
	} else {
		// console.log("male");
		relativeQuery.equalTo("Male", currentUser);
		relativeQuery.find({
			success: function(relative) {
				// console.log(relative);
				var Rules = AV.Object.extend("Rules");
				var rule = new Rules();
				rule.set('From', currentUser);
				rule.set('To', relative[0].attributes.Female);
				rule.set('Rules', request.params.Rules);
				rule.set('Score', request.params.Score);
				rule.set('Positive', request.params.Positive);
				rule.set('isActived', false);
				rule.save({
					success: function(rule) {
						var Records = AV.Object.extend("Record");
						var recordsRule = new Records();
						var opt = {
							From: rule.attributes.From,
							To: rule.attributes.To,
							Records: "增加约定",
							Score: rule.attributes.Score,
							Rules: rule.attributes.Rules
						};
						recordsRule.save(opt, {
							success: function(record) {

								AV.Push.send({
									//   where: query,
									channels: [relative[0].attributes.Female.id],
									expiration_interval: 1000 * 60 * 60 * 24,
									data: {
										alert: {
											rules: rule.get("Rules"),
											score: rule.get("Score"),
											type: 11
										},
										action: "com.pushdemo.action"
									}
								}, {
									success: function(push) {
										// console.log(push);
										response.success(rule);
									},
									error: function(obj, err) {
										//  console.log(obj);
										response.error(err);
									}
								});
							},
							error: function(obj, err) {
								response.error(err);
							}
						});
					},
					error: function(obj, err) {
						response.error(err);
					}
				});
			},
			error: function(relative, err) {
				response.error(err);
			}
		});
	}

});

//约定_查询约定
AV.Cloud.define("queryRules", function(request, response) {
	var currentUser = request.user;
	console.log(request.params.Me);
	var Relative = AV.Object.extend("Relatived");
	var relativeQuery = new AV.Query(Relative);
	if (currentUser.get("sex") == "female") {
		relativeQuery.equalTo("Female", currentUser);
		relativeQuery.find({
			success: function(rela) {
				var otherUser;
				otherUser = rela[0].get("Male");
				var Rules = AV.Object.extend("Rules");
				var querryRule = new AV.Query(Rules);
				querryRule.select("Rules", "Score");
				if (request.params.Me) { //ture:Rules.To == 我
					console.log("female true");
					//					querryRule.equalTo({
					//						To: currentUser,
					//						isActived: true
					//					});
					querryRule.equalTo("To", currentUser);
					//					querryRule.equalTo("isActived",true);
					querryRule.skip(request.params.Skip);
					querryRule.limit(3);
					querryRule.find({
						success: function(rule) {
							response.success(rule);
						},
						error: function(obj, err) {
							response.error(err);
						}
					});
				} else { //false：Rules.To == TA
					console.log("female false");
					//					querryRule.equalTo({
					//						To: otherUser,
					//						isActived: true
					//					});
					querryRule.equalTo("To", otherUser);
					//					querryRule.equalTo("isActived",true);
					querryRule.skip(request.params.Skip);
					querryRule.limit(3);
					querryRule.find({
						success: function(rule) {
							response.success(rule);
						},
						error: function(obj, err) {
							response.error(err);
						}
					});
				}
			},
			error: function(rela, err) {
				response.error(err);
			}
		});
	} else {
		relativeQuery.equalTo("Male", currentUser);
		relativeQuery.find({
			success: function(rela) {
				//				console.log(rela);
				var otherUser;
				otherUser = rela[0].get("Female");
				//				console.log(otherUser);
				var Rules = AV.Object.extend("Rules");
				var querryRule = new AV.Query(Rules);
				querryRule.select("Rules", "Score");
				if (request.params.Me) { //ture:Rules.To == 我
					console.log("male true");
					//					querryRule.equalTo({
					//						To: currentUser,
					//						isActived: true
					//					});
					querryRule.equalTo("To", currentUser);
					//					querryRule.equalTo("isActived",true);
					querryRule.skip(request.params.Skip);
					querryRule.limit(3);
					querryRule.find({
						success: function(rule) {
							response.success(rule);
						},
						error: function(obj, err) {
							response.error(err);
						}
					});
				} else { //false：Rules.To == TA
					console.log("male false");
					//					querryRule.equalTo({
					//						To: otherUser,
					//						isActived: true
					//					});
					querryRule.equalTo("To", otherUser);
					//					querryRule.equalTo("isActived",true);
					querryRule.skip(request.params.Skip);
					querryRule.limit(3);
					querryRule.find({
						success: function(rule) {
							response.success(rule);
						},
						error: function(obj, err) {
							response.error(err);
						}
					});
				}
			},
			error: function(rels, err) {
				response.error(err);
			}
		});
	}

});
//用户验证
AV.Cloud.define("validateUser", function(request, response) {
	var user = request.user;
	var Relative = AV.Object.extend("Relatived");
	var relativeQuery = new AV.Query(Relative);
	if (user.attributes.sex == "female") {
		relativeQuery.equalTo("Female", user);
		relativeQuery.find({
			success: function(rela) {
				if (rela.length === 0) return response.error("请先匹配另一半后再使用");
				// 			console.log(rela[0].attributes);
				if (rela[0].attributes.isRelatived) {
					response.success(rela[0].attributes.Male);
				} else {
					response.error("请先匹配另一半后再使用");
				}
			},
			error: function(rela, err) {
				response.error(err);
			}
		});
	} else {
		relativeQuery.equalTo("Male", user);
		relativeQuery.find({
			success: function(rela) {
				if (rela.length === 0) return response.error("请先匹配另一半后再使用");
				if (rela[0].attributes.isRelatived) {
					response.success(rela[0].attributes.Female);
				} else {
					response.error("请先匹配另一半后再使用");
				}
			},
			error: function(rels, err) {
				response.error(err);
			}
		});
	}
});

//接受约定
AV.Cloud.define("acceptRules", function(request, response) {
	//	var currentUser = request.user;
	//	console.log(currentUser);
	var Rules = AV.Object.extend("Rules");
	var querryRule = new AV.Query(Rules);
	querryRule.get(request.params.ruleId, {
		success: function(rule) {
			rule.set('isActived', true);
			rule.save({
				success: function(rule) {
					var Records = AV.Object.extend("Record");
					var recordsRule = new Records();
					var opt = {
						From: rule.attributes.From,
						To: rule.attributes.To,
						Records: "同意约定",
						Score: rule.attributes.Score,
						Rules: rule.attributes.Rules
					};
					recordsRule.save(opt, {
						success: function(record) {
							response.success("success");
						},
						error: function(obj, err) {
							response.error(err);
						}
					});
				},
				error: function(obj, err) {
					response.error(err);
				}
			});
		},
		error: function(obj, err) {
			response.error(err);
		}
	});
});

//反对约定
AV.Cloud.define("rejectRules", function(request, response) {
	//	var currentUser = request.user;
	//	console.log(currentUser);
	var Rules = AV.Object.extend("Rules");
	var querryRule = new AV.Query(Rules);
	querryRule.get(request.params.ruleId, {
		success: function(rule) {
			console.log("获取rule成功");
			var Records = AV.Object.extend("Record");
			var recordsRule = new Records();
			var opt = {
				From: rule.attributes.From,
				To: rule.attributes.To,
				Records: "反对约定",
				Score: rule.attributes.Score,
				Rules: rule.attributes.Rules
			};
			recordsRule.save(opt, {
				success: function(record) {
					console.log("保存record成功");
					rule.destroy({
						success: function(des) {
							console.log("destroy成功");
							console.log(rule.attributes.From.id);
							console.log(request.user.id);
							var channel = rule.attributes.From.id == request.user.id ?
								rule.attributes.To.id : rule.attributes.From.id;
							AV.Push.send({
								channels: [channel],
								expiration_interval: 1000 * 60 * 60 * 24,
								data: {
									alert: {
										rules: rule.get("Rules"),
										score: rule.get("Score")
									},
									action: "com.pushdemo.action"
								}
							}, {
								success: function(push) {
									console.log(push);
									response.success(push);
								},
								error: function(obj, err) {
									response.error(err);
								}
							});
						},
						error: function(err) {
							response.err(err);
						}
					});
				},
				error: function(obj, err) {
					response.error(err);
				}
			});
		},
		error: function(obj, err) {
			response.error(err);
		}
	});
});

//删除约定
AV.Cloud.define("delRules", function(request, response) {
	var Rules = AV.Object.extend("Rules");
	var querryRule = new AV.Query(Rules);
	querryRule.get(request.params.ruleId, {
		success: function(rule) {
			var Records = AV.Object.extend("Record");
			var recordsRule = new Records();
			var opt = {
				From: rule.attributes.From,
				To: rule.attributes.To,
				Records: "删除约定",
				Score: rule.attributes.Score,
				Rules: rule.attributes.Rules
			};
			recordsRule.save(opt, {
				success: function(record) {
					//					querryRule.equalTo("objectId",request.params.ruleId);
					rule.destroy({
						success: function(des) {
							AV.Push.send({
								channels: [rule.get("To").id],
								expiration_interval: 1000 * 60 * 60 * 24,
								data: {
									alert: {
										rules: rule.get("Rules"),
										score: rule.get("Score"),
										type: 12
									},
									action: "com.pushdemo.action"
								}
							}, {
								success: function(push) {
									// console.log(push);
									response.success("success");
								},
								error: function(obj, err) {
									response.error(err);
								}
							});
						},
						error: function(err) {
							response.err(err);
						}
					});
				},
				error: function(obj, err) {
					response.error(err);
				}
			});
		},
		error: function(obj, err) {
			response.error(err);
		}
	});
});

//执行约定
AV.Cloud.define("actRules", function(request, response) {
	var Rules = AV.Object.extend("Rules");
	var querryRule = new AV.Query(Rules);
	querryRule.get(request.params.ruleId, {
		success: function(rule) {
			var userQuery = new AV.Query("_User");
			userQuery.get(rule.get("To").id, {
				success: function(user) {
					user.increment("Score", rule.get("Score"));
					user.save(null, {
						success: function(user) {
							var Records = AV.Object.extend("Record");
							var recordsRule = new Records();
							var opt = {
								From: rule.attributes.From,
								To: rule.attributes.To,
								Records: "执行约定",
								Score: rule.attributes.Score,
								Rules: rule.attributes.Rules
							};
							recordsRule.save(opt, {
								success: function(record) {
									AV.Push.send({
										channels: [rule.get("To").id],
										expiration_interval: 1000 * 60 * 60 * 24,
										data: {
											alert: {
												rules: rule.get("Rules"),
												score: rule.get("Score"),
												type: 13
											},
											action: "com.pushdemo.action"
										}
									}, {
										success: function(push) {
											// console.log(push);
											response.success("success");
										},
										error: function(obj, err) {
											response.error(err);
										}
									});
								},
								error: function(obj, err) {
									response.error(err);
								}
							});
						},
						error: function(obj, err) {
							response.error(err);
						}
					});
				},
				error: function(err) {
					response.error(err);
				}
			});
		},
		error: function(obj, err) {
			response.error(err);
		}
	});
});

//发现约定
AV.Cloud.define("findRules", function(request, response) {
	var Rules = AV.Object.extend("Rules");
	var querryRule = new AV.Query(Rules);
	querryRule.select("Rules", "Score");
	querryRule.find({
		success: function(rule) {
			response.success(rule);
		},
		error: function(obj, err) {
			response.error(err);
		}
	});
});

//增加愿望
AV.Cloud.define("addWish", function(request, response) {
	var Wishes = AV.Object.extend("Wish");
	var querryWish = new Wishes();
	//	console.log(request.user);
	var score = Math.round(request.params.totolCost * 0.3 / 1);
	var opt = {
		wish: request.params.wish,
		times: 0,
		totolCost: request.params.totolCost / 1,
		femaleOffered: 0,
		maleOffered: 0,
		Relatived: {
			__type: "Pointer",
			className: "Relatived",
			objectId: request.user.get("Relatived")
		}
	};
	querryWish.save(opt, {
		success: function(wish) {
			var WishRecords = AV.Object.extend("WishRecord");
			var wishRecord = new WishRecords();
			var opt = {
				Records: "许下一个愿望，我们共同努力~",
				wishId: wish,
				wish: wish.get("wish"),
				totolCost: wish.get("totolCost"),
				times: wish.get("times")
			};
			wishRecord.save(opt, {
				success: function(record) {
					var Relative = AV.Object.extend("Relatived");
					var relativeQuery = new AV.Query(Relative);
					relativeQuery.get(request.user.get("Relatived"), {
						success: function(rela) {
							var channel = request.user.get("sex") == "male" ?
								rela.get("Female").id : rela.get("Male").id;
							AV.Push.send({
								channels: [channel],
								expiration_interval: 1000 * 60 * 60 * 24,
								data: {
									alert: {
										wish: wish.get("wish"),
										totolCost: wish.get("totolCost"),
										type: 21
									},
									action: "com.pushdemo.action"
								}
							}, {
								success: function(push) {
									// console.log(push);
									response.success(wish);
								},
								error: function(obj, err) {
									response.error(err);
								}
							});
						},
						error: function(err) {

						}
					});
				},
				error: function(obj, err) {
					response.error(err);
				}
			});
		},
		error: function(obj, err) {
			response.error(err);
		}
	});
});

//查询愿望
AV.Cloud.define("queryWish", function(request, response) {
	var Wishes = AV.Object.extend("Wish");
	var querryWish = new AV.Query(Wishes);
	querryWish.equalTo("Relatived", {
		__type: "Pointer",
		className: "Relatived",
		objectId: request.user.get("Relatived")
	});
	querryWish.find({
		success: function(rule) {
			response.success(rule);
		},
		error: function(obj, err) {
			response.error(err);
		}
	});
});

//删除愿望
AV.Cloud.define("delWish", function(request, response) {
	var Wishes = AV.Object.extend("Wish");
	var querryWish = new AV.Query(Wishes);
	var tempwish;
	querryWish.get(request.params.wishId).then(function(wish) {
		tempwish = wish;
		return wish.destroy();
	}).then(function(result) {
		var WishRecords = AV.Object.extend("WishRecord");
		var wishRecord = new WishRecords();
		var opt = {
			Records: "愿望暂时搁浅~",
			wishId: tempwish,
			wish: tempwish.get("wish"),
			totolCost: tempwish.get("totolCost"),
			times: tempwish.get("times")
		};
		wishRecord.save(opt, {
			success: function(record) {
				var Relative = AV.Object.extend("Relatived");
				var relativeQuery = new AV.Query(Relative);
				relativeQuery.get(request.user.get("Relatived"), {
					success: function(rela) {
						var channel = request.user.get("sex") == "male" ?
							rela.get("Female").id : rela.get("Male").id;
						AV.Push.send({
							channels: [channel],
							expiration_interval: 1000 * 60 * 60 * 24,
							data: {
								alert: {
									wish: tempwish.get("wish"),
									totolCost: tempwish.get("totolCost"),
									type: 22
								},
								action: "com.pushdemo.action"
							}
						}, {
							success: function(push) {
								// console.log(push);
								response.success("success");
							},
							error: function(obj, err) {
								response.error(err);
							}
						});
					},
					error: function(err) {

					}
				});
			},
			error: function(obj, err) {
				response.error(err);
			}
		});
	}, function(err) {
		response.error(err);
	});
});

//贡献愿望分
AV.Cloud.define("offerScore", function(request, response) {
	var wishId = request.params.wishId;
	var user = request.user;
	var Wishes = AV.Object.extend("Wish");
	var querryWish = new AV.Query(Wishes);
	var userQuery = new AV.Query(AV.User);
	var tempwish;
	var offerscore = request.params.offerScore / 1;
	if (user.get("sex") == "female") {
		querryWish.get(wishId).then(function(wish) {
			console.log("female");
			console.log("1");
			tempwish = wish;
			wish.increment("femaleOffered", offerscore);
			return wish.save();
		}).then(function(wish) {
			userQuery.get(user.id, {
				success: function(userr) {
					console.log("2");
					userr.increment("Score", -offerscore);
					return userr.save();
				},
				error: function(err) {
					response.error(err);
				}
			});
		}).then(function(result) {
			var WishRecords = AV.Object.extend("WishRecord");
			var wishRecord = new WishRecords();
			var opt = {
				Records: "向愿望迈进一步，女方贡献愿望分 " + offerscore + " 分",
				wishId: tempwish,
				wish: tempwish.get("wish"),
				totolCost: tempwish.get("totolCost"),
				times: tempwish.get("times")
			};
			wishRecord.save(opt, {
				success: function(record) {
					var Relative = AV.Object.extend("Relatived");
					var relativeQuery = new AV.Query(Relative);
					relativeQuery.get(request.user.get("Relatived"), {
						success: function(rela) {
							var channel = request.user.get("sex") == "male" ?
								rela.get("Female").id : rela.get("Male").id;
							AV.Push.send({
								channels: [channel],
								expiration_interval: 1000 * 60 * 60 * 24,
								data: {
									alert: {
										wish: tempwish.get("wish"),
										totolCost: tempwish.get("totolCost"),
										type: 23
									},
									action: "com.pushdemo.action"
								}
							}, {
								success: function(push) {
									// console.log(push);
									response.success("success");
								},
								error: function(obj, err) {
									response.error(err);
								}
							});
						},
						error: function(err) {

						}
					});
				},
				error: function(obj, err) {
					response.error(err);
				}
			});
		}, function(error) {
			response.error(error);
		});
	} else {
		querryWish.get(wishId).then(function(wish) {
			console.log("male");
			console.log("1");
			tempwish = wish;
			wish.increment("maleOffered", offerscore);
			return wish.save();
		}).then(function(wish) {
			userQuery.get(user.id, {
				success: function(userr) {
					console.log("2");
					userr.increment("Score", -offerscore);
					return userr.save();
				},
				error: function(err) {
					response.error(err);
				}
			});
		}).then(function(result) {
			var WishRecords = AV.Object.extend("WishRecord");
			var wishRecord = new WishRecords();
			var opt = {
				Records: "向愿望迈进一步，男方贡献愿望分 " + offerscore + " 分",
				wishId: tempwish,
				wish: tempwish.get("wish"),
				totolCost: tempwish.get("totolCost"),
				times: tempwish.get("times")
			};
			wishRecord.save(opt, {
				success: function(record) {
					var Relative = AV.Object.extend("Relatived");
					var relativeQuery = new AV.Query(Relative);
					relativeQuery.get(request.user.get("Relatived"), {
						success: function(rela) {
							var channel = request.user.get("sex") == "male" ?
								rela.get("Female").id : rela.get("Male").id;
							AV.Push.send({
								channels: [channel],
								expiration_interval: 1000 * 60 * 60 * 24,
								data: {
									alert: {
										wish: tempwish.get("wish"),
										totolCost: tempwish.get("totolCost"),
										type: 23
									},
									action: "com.pushdemo.action"
								}
							}, {
								success: function(push) {
									// console.log(push);
									response.success("success");
								},
								error: function(obj, err) {
									response.error(err);
								}
							});
						},
						error: function(err) {

						}
					});
				},
				error: function(obj, err) {
					response.error(err);
				}
			});
		}, function(error) {
			response.error(error);
		});
	}
});

//实现愿望
AV.Cloud.define("actWish", function(request, response) {
	var wishId = request.params.wishId;
	var user = request.user;
	var Wishes = AV.Object.extend("Wish");
	var querryWish = new AV.Query(Wishes);
	querryWish.get(wishId).then(function(wish) {
		wish.set("femaleOffered", 0);
		wish.set("maleOffered", 0);
		wish.increment("times");
		return wish.save();
	}).then(function(result) {
		var WishRecords = AV.Object.extend("WishRecord");
		var wishRecord = new WishRecords();
		var opt = {
			Records: "共同达成愿望la~！",
			wishId: result,
			wish: result.get("wish"),
			totolCost: result.get("totolCost"),
			times: result.get("times")
		};
		wishRecord.save(opt, {
			success: function(record) {

				var Relative = AV.Object.extend("Relatived");
				var relativeQuery = new AV.Query(Relative);
				relativeQuery.get(request.user.get("Relatived"), {
					success: function(rela) {
						var channel = request.user.get("sex") == "male" ?
							rela.get("Female").id : rela.get("Male").id;
						AV.Push.send({
							channels: [channel],
							expiration_interval: 1000 * 60 * 60 * 24,
							data: {
								alert: {
									wish: tempwish.get("wish"),
									totolCost: tempwish.get("totolCost"),
									type: 24
								},
								action: "com.pushdemo.action"
							}
						}, {
							success: function(push) {
								// console.log(push);
								response.success("success");
							},
							error: function(obj, err) {
								response.error(err);
							}
						});
					},
					error: function(err) {

					}
				});
			},
			error: function(obj, err) {
				response.error(err);
			}
		});
	}, function(error) {
		response.error(error);
	});
});

//查询Ta的信息
AV.Cloud.define("getTa", function(request, response) {
	var Relatived = AV.Object.extend("Relatived");
	var relaQuery = new AV.Query(Relatived);
	relaQuery.include("Female.nickname", "Male.photo");
	relaQuery.get(request.user.get("Relatived"), {
		success: function(rela) {
			if (request.user.get("sex") == "female") {
				response.success(rela.get("Male"));
			} else {
				response.success(rela.get("Female"));
			}
		},
		error: function(err) {
			response.error(err);
		}
	});
});

//查询约定历史记录
AV.Cloud.define("getRecordHistory", function(request, response) {
	var Record = AV.Object.extend("Record");
	var recordQuery = new AV.Query(Record);
	var d = new Date();
	d.setDate(d.getDate() - 7);
	recordQuery.greaterThanOrEqualTo("createdAt", d);
	recordQuery.contains("Records","执行约定");
	if (request.params.Me) {
		recordQuery.equalTo("To", request.user);
	} else {
		recordQuery.equalTo("From", request.user);
	}
	recordQuery.find({
		success: function(record) {
			response.success(record);
		},
		error: function(err) {
			response.error(err);
		}
	});
});