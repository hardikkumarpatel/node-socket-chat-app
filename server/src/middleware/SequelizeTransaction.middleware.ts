import sequelize from "../database/DBConnection";

const withSequelieTransaction = async (callback) => {
    const trx = await sequelize.transaction();
    try {
        const result = await callback(trx);
        await trx.commit();
        return result;
    } catch (e) {
        await trx.rollback();
        throw e;
    }
}

export { withSequelieTransaction }